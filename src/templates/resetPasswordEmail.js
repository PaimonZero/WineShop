const env = require('@config/environment');

const mailResetPassword = (resetToken) => {
    // Kiểm tra đầu vào
    if (!resetToken || typeof resetToken !== 'string') {
        throw new Error('Invalid or missing resetToken');
    }

    // Kiểm tra biến môi trường
    if (!env.CLIENT_URL) {
        throw new Error('CLIENT_URL is not defined in environment variables');
    }

    // Trả về chuỗi HTML hoàn chỉnh
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            /* Đảm bảo một số style cơ bản cho email client */
            body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
            a { text-decoration: none; }
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .btn { padding: 10px 20px !important; font-size: 14px !important; }
            }
        </style>
    </head>
    <body style="background-color: #f5e9e2;">
        <!-- Container chính (tương tự Bootstrap container) -->
        <table role="presentation" class="container" style="max-width: 600px; width: 100%; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
                <td style="background-color: #4a2c2a; padding: 20px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                    <img src="https://yourdomain.com/logo.png" alt="Barrel&Vine Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;">
                    <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700;">Barrel&Vine</h1>
                    <p style="color: #d4a5a5; font-size: 14px; margin: 5px 0 0;">Fine Wines, Timeless Moments</p>
                </td>
            </tr>
            <!-- Body -->
            <tr>
                <td style="padding: 30px; text-align: center;">
                    <h2 style="color: #4a2c2a; font-size: 22px; margin: 0 0 20px; font-weight: 600;">Reset Your Account Password</h2>
                    <p style="color: #5c4033; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        You’ve requested to reset your password for your Barrel&Vine account. 
                        Click the button below to pour a new password into your account. This link expires in 10 minutes, so act quickly!
                    </p>
                    <a href="${env.CLIENT_URL}/user/reset-password/${resetToken}" 
                        class="btn btn-primary" 
                        style="display: inline-block; padding: 12px 30px; background-color: #8b0000; color: #ffffff; font-size: 16px; font-weight: 600; border-radius: 5px; text-decoration: none; margin: 20px 0;">
                        Reset Your Password
                    </a>
                    <p style="color: #5c4033; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                        Didn’t request this? No worries, just ignore this email or contact our 
                        <a href="mailto:support@barrelvinestore.com" style="color: #8b0000; font-weight: 600;">support team</a>.
                    </p>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td style="background-color: #f5e9e2; padding: 20px; text-align: center; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                    <p style="color: #5c4033; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Barrel&Vine. All rights reserved.
                    </p>
                    <p style="color: #5c4033; font-size: 12px; margin: 10px 0 0;">
                        <a href="${
                            env.CLIENT_URL
                        }/privacy" style="color: #8b0000; text-decoration: none;">Privacy Policy</a> | 
                        <a href="${
                            env.CLIENT_URL
                        }/terms" style="color: #8b0000; text-decoration: none;">Terms of Service</a> | 
                        <a href="${
                            env.CLIENT_URL
                        }/contact" style="color: #8b0000; text-decoration: none;">Contact Us</a>
                    </p>
                    <p style="color: #5c4033; font-size: 12px; margin: 10px 0 0;">
                        Follow us: 
                        <a href="https://facebook.com/barrelvine" style="color: #8b0000; text-decoration: none; margin: 0 5px;">Facebook</a> | 
                        <a href="https://instagram.com/barrelvine" style="color: #8b0000; text-decoration: none; margin: 0 5px;">Instagram</a>
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

// Xuất hàm
module.exports = { mailResetPassword };
