import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class MailService {
    constructor() {
        this.emailUser = process.env.Google_email || process.env.GOOGLE_EMAIL;
        this.emailPassword = process.env.Google_app_password || process.env.GOOGLE_APP_PASSWORD;

        if (!this.emailUser || !this.emailPassword) {
            console.warn("Mail service is missing Google email credentials. Password reset emails will fail until Google_email and Google_app_password are set.");
        }

        this.transporter = nodemailer.createTransport({
            secure: true,
            host: "smtp.gmail.com",
            port: 465,
            auth: {
                user: this.emailUser,
                pass: this.emailPassword
            }
        })
    }

    async sendPasswordResetEmail(to, resetLink){
        if (!this.emailUser || !this.emailPassword) {
            throw new Error("Mail service is not configured. Set Google_email and Google_app_password in .env.");
        }

        const result = await this.transporter.sendMail({
            from: `"CodeAlong" <${this.emailUser}>`,
            to,
            subject: "Password Reset",
            html: `
                <p>You have requested a password reset.</p>
                <p>Please click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
            `
        });

        console.log(`Password reset email accepted for ${to}. Message ID: ${result.messageId}`);
        return result;
    }
}
 
export default new MailService();
