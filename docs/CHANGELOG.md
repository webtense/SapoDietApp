# Changelog

## 3.3.0

- Added automatic workout reminders at `19:00` based on training frequency.
- Added unified reminder dispatcher for n8n: `POST /api/cron/reminders-dispatch` with timezone handling, dedupe and WhatsApp daily rate limit.
- Added push activation UX in `/recordatorios` and public VAPID key endpoint `GET /api/push/vapid-public-key`.
- Added onboarding guard that redirects incomplete users to `/perfil`.
- Added admin v3.3 improvements: back navigation to the app and AI quota management.
- Added operational README notes for required services and the single n8n workflow `sapofit`.
- Bumped app branding/version to `SapoFit v3.3`.

## 3.2.0

- Added WhatsApp integration via Evolution API: `/api/evolution/send` and `/api/evolution/receive`, with persistence in `EvolutionMsg`.
- Added Web Push support: service worker (`/sw.js`), auto-register in the app, and API endpoints `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/notify` with DB persistence in `PushSubscription`.
- Added cron endpoint for n8n to reset AI quotas: `POST /api/cron/ai-quota-reset`.
- Improved Home KPIs and added 30-day weight chart on `/inicio`.
- Added `GET /api/tracking?type=weights&days=30` for weight-series data.
- UI branding: version label moved off the top header; now shown only in the lower nav card (SapoFit v3.2).
