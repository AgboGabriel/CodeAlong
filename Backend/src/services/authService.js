import userModel from "../models/userModel.js";
import passwordResetModel from "../models/passwordResetModel.js";
import bcrypt from 'bcrypt';
import crypto from "crypto";
import mailService from "./mailService.js";


const saltRounds = 10;
const resetTokenTTLMinutes = 30;

class AuthService{
    constructor(){
        this.userModel= userModel;
        this.passwordResetModel = passwordResetModel;
    }
 
    async registerUser(userData){
        try{
            const {username,email,password_hash}=userData;
            if (!username || !email || !password_hash) {
              throw new Error('Username, email, and password are required');
            }
            const existingUser= await this.userModel.findByEmail(email);
            if(existingUser){
                throw new Error('Email already in use');
            }
            else{
                const hashedPassword=await bcrypt.hash(password_hash,saltRounds)
                const newUser=await this.userModel.createUser({
                    username,
                    email,
                    password_hash: hashedPassword,
                });
                return newUser;
            }
        }catch(error){
            console.error('Error in registerUser:', error);
            throw error;
        }
    }
    async loginUser(email,password){
        try{
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            const user=await this.userModel.findByEmail(email);
            if(!user){
                throw new Error('User not found');
            }
            if (user.auth_provider === "google" && !user.password_hash) {
                throw new Error("This account uses Google sign-in. Please continue with Google.");
            }
            const isMatch=await bcrypt.compare(password,user.password_hash);
            if(!isMatch){
                throw new Error('Invalid credentials');
            }
            return user;
        }catch(error){
            console.error('Error in loginUser:', error);
            throw error;
        }
    }

    async requestPasswordReset(email) {
        try {
            if (!email) {
                throw new Error("Email is required");
            }

            const user = await this.userModel.findByEmail(email);
            const message = "If that email exists, a reset link has been sent.";

            if (!user || user.auth_provider !== "email" || !user.password_hash) {
                return { message };
            }

            const rawToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
            const expiresAt = new Date(Date.now() + resetTokenTTLMinutes * 60 * 1000);
            const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const resetLink = `${frontendBaseUrl}/create-new-password?token=${rawToken}`;

            await this.passwordResetModel.invalidateUserTokens(user.id);
            await this.passwordResetModel.createToken({
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
            });
            await mailService.sendPasswordResetEmail(email, resetLink);


            console.log(`Password reset link for ${email}: ${resetLink}`);

            return {
                message,
                resetLink,
            };
        } catch (error) {
            console.error("Error in requestPasswordReset:", error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            if (!token || !newPassword) {
                throw new Error("Token and new password are required");
            }

            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
            const resetRecord = await this.passwordResetModel.findValidToken(tokenHash);

            if (!resetRecord) {
                throw new Error("Reset token is invalid or has expired");
            }

            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            await this.userModel.update(resetRecord.user_id, {
                password_hash: hashedPassword,
                auth_provider: "email",
            });
            await this.passwordResetModel.markTokenUsed(resetRecord.id);
            await this.passwordResetModel.invalidateUserTokens(resetRecord.user_id);

            return { message: "Password has been reset successfully" };
        } catch (error) {
            console.error("Error in resetPassword:", error);
            throw error;
        }
    }
}
export default new AuthService();
