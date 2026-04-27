import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class MailService {
    constructor() {
        this.transporter =nodemailer.createTransport({
            secure: true,
            host:"smtp.gmail.com",
            port:465,
            auth:{
                user:process.env.Google_email,
                pass:process.env.Google_app_password
            }
        })
    }

    async sendPasswordResetEmail(to, resetLink){
        return await this.transporter.sendMail({
            from: process.env.Google_email,
            to,
            subject: "Password Reset",
            html: `
                <p>You have requested a password reset.</p>
                <p>Please click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
            `
        });

    }
}
 
export default new MailService();
