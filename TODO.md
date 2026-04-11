# Project To-Do

## P0: Beta Blockers

- [x] Align backend AI provider with GitHub Models
- [x] Add backend and frontend env examples
- [x] Rewrite setup docs to match the actual runtime
- [x] Fix the broken `photo` schema and `faces` column mismatch
- [x] Add a basic backend health endpoint
- [ ] Verify the updated SQL schema on a fresh Supabase project
- [ ] Run a full end-to-end upload/search flow against real envs

## P1: Mobile Runtime Stability

- [x] Switch development guidance to Expo Dev Client / EAS development builds
- [x] Add EAS dev-build profiles for Android and iOS simulator
- [x] Stop relying on filename-derived Android asset IDs for new uploads
- [x] Resolve local photo URIs through MediaLibrary instead of hard-coded URI patterns
- [ ] Audit old uploaded records that still contain invalid Android `device_asset_id` values
- [ ] Decide whether `device_asset_id` remains temporary metadata or is replaced by cloud storage paths
- [ ] Test local rendering after restart, cache clear, and reinstall on Android

## P1: Backend Hardening

- [x] Add image-only upload validation for photo and face routes
- [x] Add UUID and request-shape validation helpers
- [x] Validate album/photo/face IDs at controller and service boundaries
- [x] Add no-dependency backend tests
- [x] Add CI for backend syntax and tests
- [x] Add consistent error formatting across all controllers
- [x] Add rate limiting for upload and search routes
- [ ] Reduce multipart memory risk or move to direct-to-storage uploads

## P1: Frontend Code Quality

- [ ] Start TypeScript migration for the frontend
- [ ] Type photo, album, face, and auth service responses
- [ ] Type `PhotoContext` and the library/upload hooks
- [ ] Add frontend linting and test scripts
- [ ] Add tests around URI resolution and upload response handling

## P2: Consumer Product Features

- [ ] Automatic ingestion of new photos instead of manual-only uploads
- [ ] Background sync / backup queue for newly added photos
- [ ] Wi-Fi only and charging-only upload options
- [ ] Clear upload states: queued, uploading, failed, retrying, uploaded
- [ ] Reliable duplicate detection with consumer-friendly messaging
- [ ] Smart albums and automatic groupings
- [ ] People search like `photos with Ralph`
- [ ] Timeline browsing by date
- [ ] Location-based browsing and filters
- [x] Favorites, archive, and hide actions
- [ ] Cross-device access with stable cloud-backed photo storage
- [ ] Better privacy controls and user-facing deletion guarantees

## P2: Privacy And Data Handling

- [x] Remove OpenAI-specific stored-request behavior
- [ ] Document privacy for photos, embeddings, and known face descriptors
- [ ] Add account deletion / full data deletion flow
- [ ] Minimize sensitive logs in production mode

## P3: Deployment Readiness

- [x] Add a usable backend start script
- [ ] Add Railway deployment steps that are verified from a clean machine
- [ ] Add release checklist for Android and iOS dev/prod builds
- [ ] Add monitoring/logging guidance
- [ ] Add rollback notes for backend and mobile releases
