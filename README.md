# 🌾 Krishi AI - Your Crop Doctor

AI-powered crop disease diagnosis application for Indian farmers. Built with Next.js, TypeScript, MongoDB, and Google Gemini AI.

## Features

- 📸 **Image-based Diagnosis**: Capture or upload crop images for instant AI-powered disease detection
- 🎤 **Voice Input**: Ask questions in Hindi, Bengali, or English using voice commands
- 🌐 **Multilingual Support**: Full UI and AI responses in Hindi, Bengali, and English
- 📱 **PWA Ready**: Install as an app on your phone, works offline
- 📊 **History Tracking**: View past diagnoses and track disease patterns
- 💬 **WhatsApp Share**: Share diagnosis results directly via WhatsApp
- 👤 **User Profiles**: Save your farm location and preferences

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **AI**: Google Gemini 2.0 Flash (multimodal)
- **State Management**: Zustand
- **PWA**: Service Worker, Web Manifest

## Setup Instructions

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://senapati484:NRXBaYiU1pjMP7R2@cluster0.nf6twbl.mongodb.net/krishi
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── diagnose/route.ts    # Image/voice diagnosis endpoint
│   │   ├── user/route.ts         # User CRUD operations
│   │   └── history/route.ts      # Diagnosis history
│   ├── history/                  # History page
│   ├── profile/                  # User profile page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/
│   ├── CameraCapture.tsx         # Camera/image capture component
│   ├── VoiceInput.tsx            # Voice recording component
│   ├── DiagnosisResult.tsx        # Results display component
│   └── PWAInstall.tsx            # PWA install prompt
├── lib/
│   ├── mongodb.ts                # MongoDB connection
│   ├── gemini.ts                 # Gemini AI integration
│   ├── i18n.ts                   # Internationalization
│   └── utils.ts                  # Utility functions
├── models/
│   ├── User.ts                   # User schema
│   ├── Farm.ts                   # Farm schema
│   └── Diagnosis.ts              # Diagnosis schema
└── store/
    └── useStore.ts               # Zustand state management
```

## API Endpoints

### POST `/api/diagnose`

Diagnose crop disease from image, voice, or text input.

**Request Body:**

```json
{
  "image": "base64_image_string",
  "voiceTranscript": "transcript text",
  "textQuery": "query text",
  "userId": "user_id",
  "inputType": "image|voice|text",
  "language": "hi|bn|en"
}
```

### GET `/api/user?id=user_id`

Get user profile.

### POST `/api/user`

Create or update user profile.

### GET `/api/history?userId=user_id`

Get diagnosis history.

### POST `/api/history`

Get detailed diagnosis by ID.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### PWA Icons

Create and add these icon files to `/public`:

- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## Demo Flow

1. **Home Screen**: Choose to scan crop or use voice
2. **Capture Image**: Use camera or upload from gallery
3. **AI Analysis**: Gemini analyzes the image
4. **Results**: View disease, severity, and treatment advice
5. **Share**: Share results via WhatsApp
6. **History**: View past diagnoses

## Future Enhancements

- [ ] WhatsApp Business API integration
- [ ] Weather-based disease predictions
- [ ] Marketplace for treatment products
- [ ] Community features (farmer-to-farmer sharing)
- [ ] Offline mode with cached common diseases
- [ ] Multi-crop farm management

## License

MIT

## Contributors

Built for hackathon - Krishi AI Team
