import userModel from "../models/userModel.js";
import passwordResetModel from "../models/passwordResetModel.js";
import bcrypt from 'bcrypt';

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.';

function validatePasswordStrength(password) {
    if (
        typeof password !== 'string' ||
        password.length < 12 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
    ) {
        return PASSWORD_POLICY_MESSAGE;
    }

    return null;
}
import crypto from "crypto";
import mailService from "./mailService.js";


const saltRounds = 10;
const resetTokenTTLMinutes = 30;
const passwordResetRequestLimit = 3;
const passwordResetLimitWindowHours = 24;
const passwordResetCooldownSeconds = 60;

class AuthService{
    constructor(){
        this.userModel= userModel;
        this.passwordResetModel = passwordResetModel;
    }
 
    async registerUser(userData){
        try{
            const {username,email,password_hash}=userData;
            const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
            const normalizedUsername = typeof username === 'string' ? username.trim() : username;
            if (!normalizedUsername || !normalizedEmail || !password_hash) {
              throw new Error('Username, email, and password are required');
            }
                const passwordError = validatePasswordStrength(password_hash);
                if (passwordError) {
                    const error = new Error(passwordError);
                    error.code = 'WEAK_PASSWORD';
                    throw error;
                }
            const existingUser= await this.userModel.findByEmail(normalizedEmail);
            if(existingUser){
                throw new Error('Email already in use');
            }
            else{
                const hashedPassword=await bcrypt.hash(password_hash,saltRounds)
                const newUser=await this.userModel.createUser({
                    username: normalizedUsername,
                    email: normalizedEmail,
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
            const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
            if (!normalizedEmail || !password) {
                throw new Error('Email and password are required');
            }
            const user=await this.userModel.findByEmail(normalizedEmail);
            if(!user){
                throw new Error('The email address or password is incorrect. Please try again or create an account.');
            }
            if (user.auth_provider === "google" && !user.password_hash) {
                throw new Error("This account uses Google sign-in. Please continue with Google.");
            }
            const isMatch=await bcrypt.compare(password,user.password_hash);
            if(!isMatch){
                throw new Error('The email address or password is incorrect. Please try again.');
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

            const normalizedEmail = email.trim().toLowerCase();
            const user = await this.userModel.findByEmail(normalizedEmail);
            const message = "If that email exists, a reset link has been sent.";

            if (!user || user.auth_provider !== "email" || !user.password_hash) {
                const devReason = `Password reset skipped for ${normalizedEmail}: no email/password account found.`;
                if (process.env.NODE_ENV !== "production") {
                    console.log(devReason);
                }
                return { message, devReason };
            }

            const [recentRequestCount, latestRequestAt] = await Promise.all([
                this.passwordResetModel.countRecentTokens(user.id, passwordResetLimitWindowHours),
                this.passwordResetModel.findLatestTokenCreatedAt(user.id),
            ]);

            if (recentRequestCount >= passwordResetRequestLimit) {
                const limitError = new Error("For your security, password reset requests are limited to 3 every 24 hours. Please try again later.");
                limitError.statusCode = 429;
                throw limitError;
            }

            if (latestRequestAt) {
                const secondsSinceLatest = (Date.now() - new Date(latestRequestAt).getTime()) / 1000;
                if (secondsSinceLatest < passwordResetCooldownSeconds) {
                    const waitSeconds = Math.ceil(passwordResetCooldownSeconds - secondsSinceLatest);
                    const cooldownError = new Error(`Please wait ${waitSeconds} seconds before requesting another reset link.`);
                    cooldownError.statusCode = 429;
                    throw cooldownError;
                }
            }

            const rawToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
            const expiresAt = new Date(Date.now() + resetTokenTTLMinutes * 60 * 1000);
            const frontendBaseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
            const resetLink = `${frontendBaseUrl}/create-new-password?token=${rawToken}`;

            const resetToken = await this.passwordResetModel.createToken({
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
            });
            try {
                await mailService.sendPasswordResetEmail(normalizedEmail, resetLink);
                // Only invalidate older links after delivery succeeds. This
                // keeps the previously emailed link usable if SMTP fails.
                await this.passwordResetModel.invalidateUserTokens(user.id, resetToken?.id || null);
            } catch (error) {
                // Local/test environments commonly have no SMTP credentials.
                // Keep the valid token and return its link there so reset-flow
                // testing is still possible; production continues to fail
                // safely instead of pretending an email was delivered.
                if (process.env.NODE_ENV !== "production") {
                    console.warn("Password reset email unavailable; returning development reset link.");
                    return { message: "Password reset link generated for development.", resetLink, deliveryWarning: error.message };
                }
                if (resetToken?.id) await this.passwordResetModel.deleteToken(resetToken.id);
                throw error;
            }


            console.log(`Password reset link for ${normalizedEmail}: ${resetLink}`);

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
            const passwordError = validatePasswordStrength(newPassword);
            if (passwordError) throw new Error(passwordError);

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

    async changePassword(userId, currentPassword, newPassword) {
        if (!userId || !currentPassword || !newPassword) {
            throw new Error("Current password and new password are required");
        }
        const user = await this.userModel.findUserByID(userId);
        if (!user?.password_hash) {
            throw new Error("This account does not have an email password to change.");
        }
        if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
            throw new Error("Your current password is incorrect.");
        }
        const passwordError = validatePasswordStrength(newPassword);
        if (passwordError) throw new Error(passwordError);
        if (await bcrypt.compare(newPassword, user.password_hash)) {
            throw new Error("Choose a new password that differs from your current password.");
        }
        await this.userModel.update(userId, {
            password_hash: await bcrypt.hash(newPassword, saltRounds),
            auth_provider: "email",
        });
        return { message: "Password updated successfully" };
    }
}
export default new AuthService();
