# Akashic
### AI-powered photo memory app

Akashic lets users upload photos, describe them with AI, and search their library using natural language.

## Stack

| Layer | Technology |
| --- | --- |
| Mobile app | React Native + Expo |
| Navigation | Expo Router |
| Styling | NativeWind |
| Backend | Node.js + Express |
| Database | Supabase Postgres + pgvector |
| AI | GitHub Models |
| Deployment | Railway + EAS |

## Current Development Direction

- Mobile development should use **Expo Dev Client / EAS development builds**
- Do **not** use Expo Go as the primary runtime for Android permission-sensitive flows
- Backend AI calls use **GitHub Models**

## Prerequisites

- Node.js `18+`
- Xcode for iOS Simulator
- Android Studio for Android Emulator
- EAS CLI: `npm install -g eas-cli`
- Supabase project
- GitHub Personal Access Token with `models:read`

## Environment Variables

### Backend

Copy [backend/.env.example](/Users/ralph/projects/ai-photo-main/backend/.env.example) to `backend/.env`.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GITHUB_MODELS_TOKEN=your_github_pat_with_models_read
GITHUB_MODELS_CHAT_MODEL=openai/gpt-4.1-mini
GITHUB_MODELS_EMBEDDING_MODEL=openai/text-embedding-3-small
PHOTO_UPLOAD_MAX_FILE_SIZE=10485760
PHOTO_UPLOAD_MAX_BATCH_COUNT=20
PHOTO_BATCH_PROCESS_CONCURRENCY=3
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_SEARCH=30
RATE_LIMIT_MAX_MUTATIONS=60
PORT=3000
```

### Frontend

Copy [frontend/.env.example](/Users/ralph/projects/ai-photo-main/frontend/.env.example) to `frontend/.env`.

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
```

`EXPO_PUBLIC_API_URL` is the preferred way to point development builds at your backend.

## Database Setup

Run the SQL in [backend/db.sql](/Users/ralph/projects/ai-photo-main/backend/db.sql) against your Supabase project.

This script creates:

- `photo`
- `album`
- `album_photo`
- `known_face`
- vector indexes
- RLS policies
- the hybrid search RPC

## Local Backend

```bash
cd backend
npm install
npm start
```

Available endpoints:

- `GET /`
- `GET /healthz`
- `POST /api/photo`
- `POST /api/photos/batch`
- `GET /api/photos`
- `GET /api/photo/:id`
- `DELETE /api/photo/:id`
- `PATCH /api/photo/:id/descriptions`
- `PATCH /api/photo/:id/preferences`
- `POST /api/photos/search`
- `GET /api/albums`
- `POST /api/albums`
- `POST /api/albums/:id/photos`
- `DELETE /api/albums/:id/photos`
- `PATCH /api/albums/:id`
- `DELETE /api/albums/:id`
- `GET /api/faces`
- `POST /api/faces/register`
- `DELETE /api/faces/:id`

All `/api/*` endpoints require `Authorization: Bearer <token>`.

The backend also now applies basic in-memory rate limiting to:

- search requests
- photo uploads
- album mutations
- face mutations

## Local Mobile Development With EAS Dev Builds

### Install frontend dependencies

```bash
cd frontend
npm install
```

### Generate native projects

```bash
npx expo prebuild
```

### Android development build

```bash
eas build --profile development --platform android
```

Install the resulting APK on an Android emulator or device.

### iOS simulator build

```bash
eas build --profile development-simulator --platform ios
```

Install the resulting simulator build.

### Start Metro for the dev client

```bash
cd frontend
npx expo start --dev-client
```

## Why Dev Builds Instead Of Expo Go

This project depends on:

- media library access
- camera access
- secure storage
- custom native configuration

Expo Go is not the right runtime for validating those flows reliably. Use a custom dev build instead.

## Notes On AI Provider

The backend is configured for GitHub Models:

- chat model default: `openai/gpt-4.1-mini`
- embeddings model default: `openai/text-embedding-3-small`

If you want to switch models, change the backend env values instead of editing source first.

## Known Gaps

- No formal automated test suite yet
- Upload pipeline still uses in-memory multipart handling
- Local-device image identity is still being improved, especially on Android
- The repo is better suited for private beta than public production today

## Contributors

Built by Alexander Espia and Ralph Morales.
