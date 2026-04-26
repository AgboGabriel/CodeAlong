import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';


const saltRounds = 10;

class AuthService{
    constructor(){
        this.userModel= userModel;
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
}
export default new AuthService();
