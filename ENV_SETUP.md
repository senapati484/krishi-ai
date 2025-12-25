# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/krishi

# Google Gemini API Key
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeather API Key
# Get your key from: https://openweathermap.org/api
OPEN_WEATHER_API_KEY=your_openweather_api_key_here

# JWT Secret (for authentication tokens)
# Generate a random string for production
JWT_SECRET=your-random-secret-key-here

# Email Configuration (for weather alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Cron Secret (for protecting the weather check endpoint)
# Generate a random string
CRON_SECRET=your-cron-secret-here
```

## Getting API Keys

### 1. Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to `GEMINI_API_KEY`

### 2. OpenWeather API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to API Keys section
4. Generate a new key
5. Copy to `OPEN_WEATHER_API_KEY`

### 3. Email Setup (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this password (not your regular Gmail password) in `EMAIL_PASS`

### 4. JWT Secret
Generate a random string:
```bash
openssl rand -base64 32
```

### 5. Cron Secret
Generate a random string (same as JWT secret or different):
```bash
openssl rand -base64 32
```

## Vercel Deployment

When deploying to Vercel, add all these environment variables in:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with its value

## Cron Job Setup

The weather check runs every 5 minutes via Vercel Cron. The `vercel.json` file is already configured.

To manually trigger the weather check:
```bash
curl -X GET "https://your-domain.com/api/weather/check" \
  -H "Authorization: Bearer your-cron-secret"
```

