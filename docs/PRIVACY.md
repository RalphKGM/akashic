# Privacy And Data Handling

This app handles personal photos and face descriptors. Treat it like a private photo product, not a toy demo.

## What is stored

- Uploaded photo metadata in the `photo` table
- AI-generated literal and descriptive text
- Tags and category labels
- Optional `device_asset_id` values used to reconnect local media
- Registered face descriptors in `known_face`
- Album membership and cover-photo references

## What is sent to third parties

- Uploaded photo image bytes are sent to GitHub Models for image description
- Text sent for embedding generation is also sent to GitHub Models

This repo is now configured for GitHub Models rather than direct OpenAI API usage.

## Sensitive fields

The most sensitive stored fields are:

- `known_face.descriptor`
- photo descriptions/tags that may expose private context
- any `device_asset_id` values tied to on-device media

Do not log these values in production.

## Deletion behavior

Deleting an individual photo removes the `photo` row and related album links through foreign-key cascades.

Deleting an account now removes:

- `known_face` rows for the user
- `album` rows for the user
- `photo` rows for the user
- the Supabase auth user itself

The mobile client exposes this through the Profile screen.

## Remaining privacy gaps

- Uploaded originals are not yet stored in your own cloud object store
- Background upload is not yet implemented
- There is not yet a user-facing retention policy page inside the app
- Clean-machine verification of the full delete flow still needs to be performed against a real Supabase project
