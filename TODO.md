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
- [ ] Audit old uploaded records that still contain invalid Android `device_asset_id` values against a real database
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
- [x] Reduce multipart memory risk for server-side uploads
- [ ] Move fully to direct-to-storage uploads

## P1: Frontend Code Quality

- [x] Start TypeScript migration for the frontend
- [ ] Type photo, album, face, and auth service responses
- [x] Type `PhotoContext`
- [ ] Type the library/upload hooks
- [x] Add frontend verification scripts
- [ ] Add tests around URI resolution and upload response handling

## P2: Consumer Product Features

- [ ] Automatic ingestion of new photos instead of manual-only uploads
- [ ] Background sync / backup queue for newly added photos
- [ ] Wi-Fi only and charging-only upload options
- [x] Reduce manual upload friction with recent unuploaded photo suggestions
- [x] Clear upload states: selected, uploading, failed, retrying, uploaded
- [x] Reliable duplicate detection with consumer-friendly messaging
- [ ] Smart albums and automatic groupings
- [x] People search like `photos with Ralph`
- [x] Timeline browsing by date
- [ ] Location-based browsing and filters
- [x] Favorites, archive, and hide actions
- [ ] Cross-device access with stable cloud-backed photo storage
- [ ] Better privacy controls and user-facing deletion guarantees

## P2: Privacy And Data Handling

- [x] Remove OpenAI-specific stored-request behavior
- [x] Document privacy for photos, embeddings, and known face descriptors
- [x] Add account deletion / full data deletion flow
- [x] Minimize sensitive logs in production mode

## P3: Deployment Readiness

- [x] Add a usable backend start script
- [ ] Add Railway deployment steps that are verified from a clean machine
- [x] Add release checklist for Android and iOS dev/prod builds
- [x] Add monitoring/logging guidance
- [x] Add rollback notes for backend and mobile releases
