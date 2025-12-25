import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export interface WeatherAlertEmail {
  userName: string;
  location: string;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    cropImpact: string;
  }>;
  weather: {
    temp: number;
    humidity: number;
    rainfall: number;
    condition: string;
  };
  language: 'hi' | 'bn' | 'en';
}

export async function sendWeatherAlertEmail(email: string, data: WeatherAlertEmail): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email not configured. Skipping email send.');
    return;
  }

  const severityColors = {
    low: '#3b82f6',
    moderate: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  const severityLabels = {
    hi: { low: 'कम', moderate: 'मध्यम', high: 'उच्च', critical: 'गंभीर' },
    bn: { low: 'নিম্ন', moderate: 'মাঝারি', high: 'উচ্চ', critical: 'সমালোচনামূলক' },
    en: { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' },
  };

  const labels = {
    hi: {
      subject: '🌾 Krishi AI - मौसम चेतावनी',
      greeting: 'नमस्ते',
      alertTitle: 'मौसम चेतावनी',
      location: 'स्थान',
      currentWeather: 'वर्तमान मौसम',
      alerts: 'चेतावनियाँ',
      impact: 'फसल पर प्रभाव',
      temp: 'तापमान',
      humidity: 'आर्द्रता',
      rainfall: 'वर्षा',
      condition: 'स्थिति',
    },
    bn: {
      subject: '🌾 Krishi AI - আবহাওয়া সতর্কতা',
      greeting: 'নমস্কার',
      alertTitle: 'আবহাওয়া সতর্কতা',
      location: 'অবস্থান',
      currentWeather: 'বর্তমান আবহাওয়া',
      alerts: 'সতর্কতা',
      impact: 'ফসলের উপর প্রভাব',
      temp: 'তাপমাত্রা',
      humidity: 'আর্দ্রতা',
      rainfall: 'বৃষ্টিপাত',
      condition: 'অবস্থা',
    },
    en: {
      subject: '🌾 Krishi AI - Weather Alert',
      greeting: 'Hello',
      alertTitle: 'Weather Alert',
      location: 'Location',
      currentWeather: 'Current Weather',
      alerts: 'Alerts',
      impact: 'Crop Impact',
      temp: 'Temperature',
      humidity: 'Humidity',
      rainfall: 'Rainfall',
      condition: 'Condition',
    },
  };

  const t = labels[data.language];
  const severityT = severityLabels[data.language];

  const alertsHtml = data.alerts
    .map(
      (alert) => `
    <div style="margin: 15px 0; padding: 15px; border-left: 4px solid ${severityColors[alert.severity as keyof typeof severityColors]}; background: #f9fafb;">
      <div style="font-weight: bold; color: ${severityColors[alert.severity as keyof typeof severityColors]}; margin-bottom: 8px;">
        ${severityT[alert.severity as keyof typeof severityT]} - ${alert.type.toUpperCase()}
      </div>
      <div style="margin-bottom: 8px;">${alert.message}</div>
      <div style="color: #6b7280; font-size: 14px;">
        <strong>${t.impact}:</strong> ${alert.cropImpact}
      </div>
    </div>
  `
    )
    .join('');

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
        .weather-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌾 Krishi AI</h1>
          <p>${t.alertTitle}</p>
        </div>
        <div class="content">
          <p>${t.greeting} ${data.userName},</p>
          <p>We detected weather conditions that may affect your crops at <strong>${data.location}</strong>.</p>
          
          <div class="weather-box">
            <h3 style="margin-top: 0;">${t.currentWeather}</h3>
            <p><strong>${t.temp}:</strong> ${data.weather.temp.toFixed(1)}°C</p>
            <p><strong>${t.humidity}:</strong> ${data.weather.humidity}%</p>
            <p><strong>${t.rainfall}:</strong> ${data.weather.rainfall.toFixed(1)}mm</p>
            <p><strong>${t.condition}:</strong> ${data.weather.condition}</p>
          </div>

          <h3>${t.alerts}:</h3>
          ${alertsHtml}

          <p style="margin-top: 30px;">
            <strong>Stay safe and protect your crops!</strong><br>
            For more information, visit Krishi AI app.
          </p>
        </div>
        <div class="footer">
          <p>Krishi AI - Your Crop Doctor</p>
          <p>This is an automated alert. Please check your app for detailed recommendations.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Krishi AI" <${EMAIL_USER}>`,
      to: email,
      subject: t.subject,
      html,
    });
    console.log(`Weather alert email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

