// FILE: services/emailService.js
// Real-time Email Service using Nodemailer for OTP and Notifications

const nodemailer = require('nodemailer');

// ==========================================
// EMAIL TRANSPORTER CONFIGURATION
// ==========================================

// For development: Use Ethereal (fake SMTP) or Gmail
// For production: Use SendGrid, Mailgun, AWS SES, etc.

let transporter;

const initializeTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Development with Gmail or custom SMTP
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Fallback: Create test account with Ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Using Ethereal test email account');
    console.log('   Test emails viewable at: https://ethereal.email');
  }

  // Verify transporter
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

// ==========================================
// EMAIL TEMPLATES
// ==========================================

const getOTPEmailTemplate = (otp, userName) => ({
  subject: `🔐 Your Nexora Verification Code: ${otp}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ Nexora</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Fraud Predictor & Protection</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e; margin: 0 0 10px;">Hello${userName ? `, ${userName}` : ''}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You requested a verification code for your Nexora account. Use the code below to complete your verification:
          </p>
          
          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px; font-size: 14px;">Your Verification Code</p>
            <div style="font-size: 42px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            ⏱️ This code expires in <strong>10 minutes</strong>
          </p>
          
          <!-- Warning -->
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 25px;">
            <p style="color: #856404; margin: 0; font-size: 13px;">
              ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. Nexora will never ask for your OTP via phone or email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #888; margin: 0; font-size: 12px;">
            If you didn't request this code, please ignore this email or contact support.
          </p>
          <p style="color: #aaa; margin: 10px 0 0; font-size: 11px;">
            © ${new Date().getFullYear()} Nexora Fraud Predictor. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Your Nexora Verification Code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
});

const getAlertEmailTemplate = (alertData) => ({
  subject: `🚨 ${alertData.riskLevel.toUpperCase()} RISK Alert - ${alertData.alertType.toUpperCase()} from ${alertData.fromEntity}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: ${alertData.riskLevel === 'critical' ? '#dc3545' : alertData.riskLevel === 'high' ? '#fd7e14' : '#ffc107'}; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Fraud Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: bold;">
            ${alertData.riskLevel.toUpperCase()} RISK DETECTED
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Alert Type</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${alertData.alertType.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px; border-top: 1px solid #eee;">From</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right; font-family: monospace; border-top: 1px solid #eee;">${alertData.fromEntity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px; border-top: 1px solid #eee;">Risk Score</td>
                <td style="padding: 8px 0; color: #dc3545; font-weight: bold; text-align: right; border-top: 1px solid #eee;">${alertData.riskScore}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px; border-top: 1px solid #eee;">Category</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right; border-top: 1px solid #eee;">${alertData.category || 'Unknown'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ${alertData.message || 'This entity has been flagged as potentially dangerous. Exercise caution.'}
          </p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View in Dashboard →
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 15px 30px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #aaa; margin: 0; font-size: 11px;">
            © ${new Date().getFullYear()} Nexora Fraud Predictor. Stay Safe!
          </p>
        </div>
      </div>
    </body>
    </html>
  `
});

const getWelcomeEmailTemplate = (userName, enabledProtections) => ({
  subject: `🎉 Welcome to Nexora Fraud Predictor, ${userName}!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0; font-size: 18px;">
            You're now protected by Nexora
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e; margin: 0 0 15px;">Hello, ${userName}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining Nexora Fraud Predictor. Your account is now active and ready to protect you from fraud.
          </p>
          
          ${enabledProtections.length > 0 ? `
          <!-- Enabled Protections -->
          <div style="background: #e8f5e9; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 15px; font-size: 16px;">✅ Your Active Protections</h3>
            <ul style="margin: 0; padding-left: 20px; color: #388e3c;">
              ${enabledProtections.map(p => `<li style="margin: 8px 0;">${p}</li>`).join('')}
            </ul>
          </div>
          ` : `
          <div style="background: #fff3cd; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⚠️ No protections enabled yet. Visit Settings to enable call, SMS, email, or UPI protection.
            </p>
          </div>
          `}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #888; margin: 0; font-size: 12px;">
            Need help? Reply to this email or visit our help center.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
});

// ==========================================
// EMAIL SENDING FUNCTIONS
// ==========================================

const sendEmail = async (to, template) => {
  if (!transporter) {
    await initializeTransporter();
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Nexora Fraud Predictor" <noreply@nexora.app>',
    to,
    subject: template.subject,
    html: template.html,
    text: template.text || ''
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    
    // For Ethereal test accounts, log preview URL
    if (info.messageId && transporter.options?.host === 'smtp.ethereal.email') {
      console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email Verification Template
const getEmailVerificationTemplate = (userName, verificationUrl) => ({
  subject: `✉️ Verify Your Email - Nexora Fraud Predictor`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ Nexora</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Fraud Predictor & Protection</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e; margin: 0 0 10px;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi${userName ? ` ${userName}` : ''}! Thanks for registering with Nexora Fraud Predictor. 
            Please verify your email address to unlock all features.
          </p>
          
          <!-- Verify Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
              ✓ Verify Email Address
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            ⏱️ This link expires in <strong>24 hours</strong>
          </p>
          
          <p style="color: #888; font-size: 13px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <!-- Security Notice -->
          <div style="background: #e8f4fd; border: 1px solid #b8daff; border-radius: 8px; padding: 15px; margin-top: 25px;">
            <p style="color: #004085; margin: 0; font-size: 13px;">
              🔒 <strong>Security:</strong> Once verified, you'll have full access to fraud reporting, risk checking, and real-time protection features.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #888; margin: 0; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
          <p style="color: #aaa; margin: 10px 0 0; font-size: 11px;">
            © ${new Date().getFullYear()} Nexora Fraud Predictor. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hi${userName ? ` ${userName}` : ''}!\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\n© ${new Date().getFullYear()} Nexora Fraud Predictor`
});

// Public API
const emailService = {
  initialize: initializeTransporter,
  
  sendOTP: async (email, otp, userName) => {
    const template = getOTPEmailTemplate(otp, userName);
    return sendEmail(email, template);
  },
  
  sendAlert: async (email, alertData) => {
    const template = getAlertEmailTemplate(alertData);
    return sendEmail(email, template);
  },
  
  sendWelcome: async (email, userName, enabledProtections = []) => {
    const template = getWelcomeEmailTemplate(userName, enabledProtections);
    return sendEmail(email, template);
  },
  
  sendEmailVerification: async (email, userName, verificationUrl) => {
    const template = getEmailVerificationTemplate(userName, verificationUrl);
    return sendEmail(email, template);
  }
};

module.exports = emailService;
