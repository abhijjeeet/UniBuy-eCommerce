import { appConfig } from '../../config/app.config';
import nodemailer from 'nodemailer';

interface SendEmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

// 1. Create a transporter object using your email service's SMTP settings.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: appConfig.user,
        pass: appConfig.pass
    },
});

/**
 * Sends an email using the pre-configured Nodemailer transporter.
 * @param {string} to - The recipient's email address.
 * @param {string} otp - The one-time password to include in the email.
 * @returns {Promise<{ success: boolean; message: string; }>} - An object indicating success or failure.
 */
export const sendOtpEmail = async (to: string, otp: string): Promise<{ success: boolean; message: string; }> => {
    const mailOptions: SendEmailOptions = {
        from:`"UniBuy" <${appConfig.user}>`,
        to,
        subject: 'Your Verification Code',
        html: `
        <div style="font-family:sans-serif;padding:20px">
          <h2>🔐 Your UniBuy Verification Code</h2>
          <p>Use this OTP to verify your email. It expires in <b>5 minutes</b>.</p>
          <h1 style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;display:inline-block;">${otp}</h1>
          <p>If you didn’t request this, please ignore it.</p>
          <p>— The UniBuy Team</p>
        </div>
      `,
    };


    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully: %s', info.messageId);
        return { success: true, message: 'OTP email sent successfully.' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send OTP email.' };
    }
};












