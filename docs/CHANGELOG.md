# Changelog

## 3.2.0

- Added WhatsApp integration via Evolution API: `/api/evolution/send` and `/api/evolution/receive`, with persistence in `EvolutionMsg`.
- Added Web Push support: service worker (`/sw.js`), auto-register in the app, and API endpoints `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/notify` with DB persistence in `PushSubscription`.
- Added cron endpoint for n8n to reset AI quotas: `POST /api/cron/ai-quota-reset`.
- Improved Home KPIs and added 30-day weight chart on `/inicio`.
- Added `GET /api/tracking?type=weights&days=30` for weight-series data.
- UI branding: version label moved off the top header; now shown only in the lower nav card (SapoFit v3.2).
