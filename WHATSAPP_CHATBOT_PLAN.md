# WhatsApp Chatbot Implementation Plan (Krishi AI)

## Goals

- Let farmers query crop health, soil advice, weather, and video tutorials via WhatsApp.
- Support English/Hindi/Bengali; default to English.
- Reuse existing APIs (diagnose, history, videos, weather) with minimal duplication.

## High-Level Flow

1. User sends a message/photo/voice on WhatsApp.
2. Webhook (WhatsApp Cloud API) receives the event.
3. We parse intent (text/voice) and attachments (images).
4. Call internal services:
   - Image -> `/api/diagnose` (inputType: image)
   - Voice/text -> `/api/diagnose` (inputType: voice/text)
   - History -> `/api/history?userId=...`
   - Weather -> `/api/weather/current?lat=...&lon=...`
   - Videos -> `/api/videos` (filter by crop/disease/language)
5. Format WhatsApp responses (templates or interactive messages).
6. Persist conversation context (Mongo) for follow-ups.

## Components

- **Webhook Endpoint**: New `/api/webhooks/whatsapp` (verify token + signature if using Meta Cloud API). Accepts `messages` events.
- **Message Router**: Detects type (text, image, voice, location) and language hint.
- **Services**: Reuse existing libs/routes: gemini (diagnose), weather, history, videos.
- **Response Builder**: Simple text + quick replies (buttons) + media URLs for images/thumbnails.
- **State**: Mongo collection `ChatSession` storing userId/waUserId/language/lastIntent/location.

## Data & Mapping

- Identify WA user via `from` number; map to internal `userId` (create if missing).
- Language: read from user profile or inferred from message; fall back to `en`.
- Location: accept location messages; cache to user.lastLocation for weather.

## Security & Ops

- Verify `X-Hub-Signature-256` (if enabled) and `verify_token` during setup.
- Protect webhook with allowlist of Meta IPs if possible.
- Rate-limit per WA user; log errors to server console/monitoring.
- Env vars: `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, existing `CRON_SECRET`, `OPEN_WEATHER_API_KEY`, `GEMINI_API_KEY`, `MONGODB_URI`.

## API Contracts (internal reuse)

- `/api/diagnose`: { image | voiceTranscript | textQuery, inputType, userId, language }
- `/api/history?userId`
- `/api/weather/current?lat&lon&language`
- `/api/videos?crop&disease&treatmentType&language&limit`

## Sample User Journeys

- **Image Diagnosis**: User sends leaf photo -> webhook downloads -> call `/api/diagnose` -> reply with summary, severity, and top 3 treatments + CTA to view video tutorial link.
- **Voice/Text Query**: Send voice note -> transcribe (optional upstream) -> `/api/diagnose` with inputType voice/text -> reply with advice + quick replies ("Show videos", "Weather now").
- **Weather Check**: User sends location or text "weather" -> use stored location or provided coords -> `/api/weather/current` -> reply with concise weather + risk summary.
- **Videos**: User asks "video for early blight" -> `/api/videos?crop=tomato&disease=Early Blight&language=en` -> return top link + thumbnail.

## Rollout Steps

1. Add webhook route + signature verification.
2. Implement message router + intents (diagnose, weather, videos, help).
3. Map WA users to internal users; store sessions.
4. Create response templates (text/buttons/media URLs).
5. Add logging/metrics; test in sandbox WA phone.
6. Enable rate limits and error fallbacks.

## Testing

- Unit: webhook parser, intent router, response builder.
- Integration: end-to-end sandbox message -> webhook -> internal APIs -> reply.
- Data: confirm user created and language persisted; ensure weather and videos return data.

## Nice-to-Haves (after MVP)

- Persistent multi-turn context (follow-up questions).
- Voice transcription upstream (Meta) or internal.
- Auto-language detection and translation for responses.
- Media templates for video thumbnails; CTA buttons to open full video/tutorial.
