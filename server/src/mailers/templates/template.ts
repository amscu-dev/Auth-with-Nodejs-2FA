export const verifyEmailTemplate = (
  url: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "Confirm your Authy account",
  text: `Please verify your email address by clicking the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-weight:bold; font-size: 24px; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .header img { max-width: 40px; margin-bottom: 10px; }
      .content { padding: 20px; text-align: center; }
      .content h1 { font-size: 24px; color: #333333; }
      .content p { font-size: 16px; color: #666666; margin: 10px 0 20px; }
      .button { display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold;  background-color: ${brandColor}; color: #fff!important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
    </style></head><body>
      <div class="container">
        <div class="header">Authy</div>
        <div class="content">
          <h1>Confirm Your Email Address</h1>
          <p>Thank you for signing up! Please confirm your account by clicking the button below.</p>
          <a href="${url}" class="button">Confirm account</a>
          <p>If you did not create this account, please disregard this email.</p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        </div>
      </div>
    </body></html>
  `,
});

export const magicLinkEmailTemplate = (
  magicLinkUrl: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "Your Magic Login Link",
  text: `Click the button in this email to sign in to your account.`, // fără URL direct
  html: `
    <html>
      <head>
        <style>
          body, html {
            margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;
          }
          .container {
            max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;
            border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: ${brandColor}; font-weight: bold; font-size: 24px; color: #ffffff;
            padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;
          }
          .content {
            padding: 20px; text-align: center;
          }
          .content h1 {
            font-size: 24px; color: #333333;
          }
          .content p {
            font-size: 16px; color: #666666; margin: 10px 0 20px;
          }
          .button {
            display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold;
            background-color: ${brandColor}; color: #fff!important; border-radius: 5px;
            text-decoration: none; margin-top: 20px;
          }
          .footer {
            font-size: 14px; color: #999999; text-align: center; padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Authy</div>
          <div class="content">
            <h1>Sign in to your account</h1>
            <p>Click the button below to sign in instantly. This link is valid for a limited time.</p>
            <a href="${magicLinkUrl}" class="button">Sign in</a>
            <p>If you did not request this link, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});

export const passwordResetTemplate = (
  url: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "Reset Your Password",
  text: `To reset your password, please click the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-size: 24px;  font-weight:bold; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .header img { max-width: 40px; margin-bottom: 10px; }
      .content { padding: 20px; text-align: center; }
      .content h1 { font-size: 24px; color: #333333; }
      .content p { font-size: 16px; color: #666666; margin: 10px 0 20px; }
      .button { display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; background-color: ${brandColor};  color: #fff !important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
    </style></head><body>
      <div class="container">
        <div class="header">Squeezy</div>
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to proceed with resetting your password.</p>
          <a href="${url}" class="button">Reset Password</a>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        </div>
      </div>
    </body></html>
  `,
});

export const passwordResetSuccessTemplate = (
  ip: string | undefined,
  userAgent: string | undefined,
  city: string | undefined,
  region: string | undefined,
  country: string | undefined,
  brandColor: string = "#2563EB"
) => ({
  subject: "Your Password Has Been Reset Successfully",
  text: `Your password has been changed successfully. If you did not perform this action, please secure your account immediately.`,
  html: `
    <html>
      <head>
        <style>
          body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .header { background-color: ${brandColor}; font-weight: bold; font-size: 24px; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
          .content { padding: 20px; text-align: center; }
          .content h1 { font-size: 24px; color: #333; }
          .content p { font-size: 16px; color: #666; margin: 10px 0 20px; }
          .info { text-align: left; background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 14px; color: #555; margin-top: 10px; }
          .button { display: inline-block; padding: 12px 20px; font-size: 16px; font-weight: bold; background-color: ${brandColor}; color: #fff !important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
          .footer { font-size: 14px; color: #999; text-align: center; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Authy</div>
          <div class="content">
            <h1>Password Reset Successful</h1>
            <p>Your password has been changed successfully. If you did not perform this action, please secure your account immediately.</p>
            <div class="info">
              <p><strong>IP Address:</strong> ${ip}</p>
              <p><strong>User Agent:</strong> ${userAgent}</p>
              <p><strong>Location:</strong> ${city}, ${region}, ${country}</p>
            </div>
            <a href="#" class="button">Secure Account</a>
          </div>
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});
