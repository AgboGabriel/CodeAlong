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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
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

        let result;
        try {
            result = await this.transporter.sendMail({
                from: `"CodeAlong" <${this.emailUser}>`,
                to,
                subject: "Reset your CodeAlong password",
                html: `
                    <p>You requested a CodeAlong password reset.</p>
                    <p>This link expires in 30 minutes. If you did not request it, you can safely ignore this email.</p>
                    <p><a href="${resetLink}">Reset Password</a></p>
                `
            });
        } catch (error) {
            console.error("Password reset email delivery failed:", error.message);
            const deliveryError = new Error("We could not send the password-reset email right now. Please try again shortly.");
            deliveryError.statusCode = 503;
            throw deliveryError;
        }

        console.log(`Password reset email accepted for ${to}. Message ID: ${result.messageId}`);
        return result;
    }
}
 
export default new MailService();
