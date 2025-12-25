import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendVerificationCode(
  email: string,
  code: string,
  language: 'hi' | 'bn' | 'en' = 'en'
): Promise<void> {
  // Debug: Log environment variables (without showing passwords)
  console.log('Email Config Check:', {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
    EMAIL_PASS: EMAIL_PASS ? 'SET' : 'NOT SET',
  });

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email not configured. EMAIL_USER or EMAIL_PASS missing.');
    console.warn(`[DEV] Verification code for ${email}: ${code}`);
    throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env.local and restart the server.');
  }

  // Verify transporter is configured
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email server connection failed: ${errorMessage}. Please check your email configuration and ensure you're using an App Password for Gmail.`);
  }

  const labels = {
    hi: {
      subject: '🌾 Krishi AI - ईमेल सत्यापन कोड',
      greeting: 'नमस्ते',
      message: 'आपका ईमेल सत्यापन कोड है:',
      code: 'कोड',
      validity: 'यह कोड 10 मिनट के लिए वैध है।',
      ignore: 'यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।',
    },
    bn: {
      subject: '🌾 Krishi AI - ইমেইল যাচাইকরণ কোড',
      greeting: 'নমস্কার',
      message: 'আপনার ইমেইল যাচাইকরণ কোড হল:',
      code: 'কোড',
      validity: 'এই কোড 10 মিনিটের জন্য বৈধ।',
      ignore: 'আপনি যদি এই অনুরোধ না করে থাকেন, অনুগ্রহ করে এই ইমেইলটি উপেক্ষা করুন।',
    },
    en: {
      subject: '🌾 Krishi AI - Email Verification Code',
      greeting: 'Hello',
      message: 'Your email verification code is:',
      code: 'Code',
      validity: 'This code is valid for 10 minutes.',
      ignore: 'If you did not request this, please ignore this email.',
    },
  };

  const t = labels[language];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .code-box { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #22c55e; letter-spacing: 8px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌾 Krishi AI</h1>
          <p>${t.subject}</p>
        </div>
        <div class="content">
          <p>${t.greeting},</p>
          <p>${t.message}</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>${t.validity}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            ${t.ignore}
          </p>
        </div>
        <div class="footer">
          <p>Krishi AI - Your Crop Doctor</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Krishi AI" <${EMAIL_USER}>`,
      to: email,
      subject: t.subject,
      html,
    });
    console.log(`✅ Verification code sent to ${email}`);
    console.log('Email message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        code: (error as Error & { code?: string }).code,
        command: (error as Error & { command?: string }).command,
      });
    }
    throw error;
  }
}

