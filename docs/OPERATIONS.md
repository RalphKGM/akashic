# Operations Guide

This project now has enough moving pieces that deployment and release steps should be explicit rather than tribal knowledge. Use this as the baseline checklist for backend deploys and Expo/EAS releases.

## Railway Backend Deploy

### Required variables

Set these in Railway before the first deploy:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_MODELS_TOKEN`
- `GITHUB_MODELS_CHAT_MODEL`
- `GITHUB_MODELS_EMBEDDING_MODEL`
- `AI_REQUEST_TIMEOUT_MS`
- `AI_REQUEST_MAX_RETRIES`
- `AI_RETRY_BASE_DELAY_MS`
- `PHOTO_UPLOAD_MAX_FILE_SIZE`
- `PHOTO_UPLOAD_MAX_BATCH_COUNT`
- `PHOTO_BATCH_PROCESS_CONCURRENCY`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_SEARCH`
- `RATE_LIMIT_MAX_MUTATIONS`
- `PORT`

### Deploy checklist

1. Confirm the target Supabase project already has the SQL from [backend/db.sql](/Users/ralph/projects/ai-photo-main/backend/db.sql) applied.
2. Confirm the GitHub Models token has `models:read`.
3. Set or review all Railway environment variables.
4. Deploy from the current `main` branch.
5. Verify `GET /healthz` returns `status: ok`.
6. Smoke test `POST /api/photo`, `GET /api/photos`, and `POST /api/photos/search` against production.
7. If account deletion is enabled in production, smoke test `DELETE /api/account` against a disposable test user.
8. Run `npm run audit:device-assets` in [backend](/Users/ralph/projects/ai-photo-main/backend) against production credentials when auditing legacy Android asset IDs.

### Logging and monitoring

- Watch Railway logs during deploy for startup errors, missing env vars, Supabase auth failures, or GitHub Models timeout/retry storms.
- Check `GET /healthz` after every deploy; the response now includes upload/rate-limit/AI timeout config so you can verify runtime values quickly.
- Watch for repeated `AI_REQUEST_TIMEOUT` or `GITHUB_MODELS_REQUEST_FAILED` errors; if those spike, increase timeout carefully or reduce photo upload concurrency.

### Rollback

1. Re-deploy the previous known-good Railway release.
2. Verify `GET /healthz`.
3. Re-run the same photo upload/search smoke tests.
4. If the issue is model-related, revert the GitHub Models env changes separately from code changes.

## Expo / EAS Release Checklist

### Development builds

1. Run `npm install` in [frontend](/Users/ralph/projects/ai-photo-main/frontend).
2. Confirm [frontend/.env.example](/Users/ralph/projects/ai-photo-main/frontend/.env.example) values are mirrored in your local `.env`.
3. Run `npm run typecheck`.
4. Start the Metro server with `npm run start:dev-client`.
5. Build Android dev client with `eas build --profile development --platform android`.
6. Build iOS simulator client with `eas build --profile development-simulator --platform ios`.
7. Verify login, upload, search, albums, favorites/archive/hide, and face registration on device or simulator.
8. Verify timeline filters and quick people-search chips in the library.

### Production builds

1. Confirm `EXPO_PUBLIC_API_URL` points at the production backend.
2. Confirm the production backend `healthz` endpoint is green before building the app.
3. Run `eas build --profile production --platform android`.
4. Run `eas build --profile production --platform ios`.
5. Install the build and verify:
   - auth
   - upload from gallery
   - search
   - albums
   - favorites/archive/hide
   - timeline filters
   - quick people-search chips
   - profile cache clear
   - account deletion on a disposable test account

### Mobile rollback

- Keep the previous EAS production artifact available until the new backend and mobile build are both stable.
- If a release breaks uploads or search, roll the backend back first if the issue is API or AI related.
- If the backend is healthy and the regression is client-only, re-submit the previous working EAS artifact.

## Known Remaining Gaps

- Railway deployment steps are documented here but still need a true clean-machine verification pass.
- Automatic background backup is still not implemented; upload remains foreground-driven, with recent-photo suggestions to reduce friction.
- Web export still fails because `react-native-pager-view` is native-only in the current viewer stack. Native Android and iOS exports are the supported targets.
