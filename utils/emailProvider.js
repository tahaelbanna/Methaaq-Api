/* eslint-disable import/no-extraneous-dependencies */

const { BrevoClient } = require('@getbrevo/brevo');

const htmlTemplate = (name, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          
          <!-- Header Image -->
          <tr>
            <td align="center" style="padding:30px 20px 10px 20px;">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwpns-X-9XbgICullbkDoRNC-FxvdP24wYUw&s" 
                   alt="Email verification code" 
                   width="120" 
                   style="display:block;border-radius:8px;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:10px 30px;">
              <h2 style="margin:0;color:#1a1a1a;">Reset Your Password</h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td align="center" style="padding:20px 40px;color:#555;font-size:15px;line-height:1.6;">
              Hi <strong>${name}</strong>,<br><br>
              We received a request to verify your methaaq account.
              Use the verification code below to continue.
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td align="center" style="padding:10px 40px;">
              <div style="
                background:#f0f4ff;
                color:#2b4eff;
                font-size:28px;
                letter-spacing:6px;
                font-weight:bold;
                padding:18px 0;
                border-radius:8px;">
                ${code}
              </div>
            </td>
          </tr>

          <!-- Expiry Text -->
          <tr>
            <td align="center" style="padding:20px 40px;color:#777;font-size:14px;">
              This code is valid for <strong>10 minutes</strong> only.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 20px;background:#fafafa;color:#999;font-size:12px;">
              If you didn’t request this, you can safely ignore this email.<br>
              © ${new Date().getFullYear()} methaaq. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const passwordHtmlTemplate = (name, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>password reset code code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          
          <!-- Header Image -->
          <tr>
            <td align="center" style="padding:30px 20px 10px 20px;">
              <img src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.reddit.com%2Fr%2FEgypt%2Fcomments%2F1ms7kty%2F%25D9%258A%25D8%25B9%25D9%2586%25D9%258A_%25D8%25A3%25D9%258A%25D9%2587_%25D8%25A3%25D8%25B3%25D8%25AA%25D8%25B1_%25D9%258A%25D8%25A7_%25D8%25AF%25D9%2588%25D9%2584%25D9%258A%2F&psig=AOvVaw3cWgK-08-9mp0dRI5yn_0P&ust=1772492032577000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOjShcHl_5IDFQAAAAAdAAAAABAE" 
                   alt="password reset code" 
                   width="120" 
                   style="display:block;border-radius:8px;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:10px 30px;">
              <h2 style="margin:0;color:#1a1a1a;">Reset Your Password</h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td align="center" style="padding:20px 40px;color:#555;font-size:15px;line-height:1.6;">
              Hi <strong>${name}</strong>,<br><br>
              We received a request to reset your methaaq account password.
              Use the reset code below to continue.
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td align="center" style="padding:10px 40px;">
              <div style="
                background:#f0f4ff;
                color:#2b4eff;
                font-size:28px;
                letter-spacing:6px;
                font-weight:bold;
                padding:18px 0;
                border-radius:8px;">
                ${code}
              </div>
            </td>
          </tr>

          <!-- Expiry Text -->
          <tr>
            <td align="center" style="padding:20px 40px;color:#777;font-size:14px;">
              This code is valid for <strong>10 minutes</strong> only.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 20px;background:#fafafa;color:#999;font-size:12px;">
              If you didn’t request this, you can safely ignore this email.<br>
              © ${new Date().getFullYear()} methaaq. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendEmail = async (options) => {
    const client = new BrevoClient({
        apiKey: process.env.BREVO_API_KEY,
    });
    await client.transactionalEmails.sendTransacEmail({
        subject: options.subject,
        htmlContent: htmlTemplate(options.name, options.code),
        sender: {
            name: 'Methaaq App',
            email: process.env.EMAIL_USER,
        },
        to: [
            {
                email: options.email,
                name: options.name,
            },
        ],
    });
};

const passwordEmailSender = async (options) => {
    const client = new BrevoClient({
        apiKey: process.env.BREVO_API_KEY,
    });
    await client.transactionalEmails.sendTransacEmail({
        subject: options.subject,
        htmlContent: passwordHtmlTemplate(options.name, options.code),
        sender: {
            name: 'Methaaq App',
            email: process.env.EMAIL_USER,
        },
        to: [
            {
                email: options.email,
                name: options.name,
            },
        ],
    });
};

module.exports = {
  sendEmail,
  passwordEmailSender,
};
