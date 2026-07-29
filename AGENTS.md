# Project Context

## Stack
- Vue 3 + TypeScript + Vite
- Firebase Firestore (direct reads/writes, no local DB)
- Pinia (admin store only; alumno store is session-only)
- Tailwind CSS
- PWA via vite-plugin-pwa (manifest + app shell only, no data caching)

## Architecture

### Data flow
- All data read/written directly to Firebase Firestore. No IndexedDB/Dexie, no offline queue, no dirty flags, no sync.
- After every CUD (create/update/delete), data is re-fetched from Firestore — no local array mutations.
- Admin authenticates via simple username/password check against Firestore `admins` collection.
- Alumno authenticates via DNI lookup in `personas` collection; session (DNI + gym) saved to localStorage.
- Each admin's data (personas, planes) is scoped by `adminId` field.

### Firestore
- Single collection `ejercicios` for all exercises (imported + custom).
- Imported exercises: `es_personalizado: false, adminId: null`.
- Custom exercises: `es_personalizado: true, adminId: <adminId>`, ID format `custom_<Date.now()>`.
- Document size limit ~1 MiB. Videos stored as base64 (400KB–1.1MB), thumbnails as base64 JPEG (20–55KB).
- No client-side translation. Spanish values stored directly in Firestore fields (`name`, `category`, `equipment`, `target`, `muscle_group`).

### Custom exercises
- Created via AdminView with GifRecorder (camera recording or file upload).
- Saved with same fields as imported: `body_part`, `secondary_muscles`, `image`, `gif_url`, `media_id`, `instruction_steps`, `attribution`.
- `image` field is a JPEG thumbnail (320px max, quality 0.7) captured from the video at ~0.5s.
- After saving, `cargarCustomEjercicios()` reloads the list from Firestore.

### Exercise browser
- Requires ≥4 characters in search text, OR a category/equipment filter selected, before showing results.
- Image precedence: `video_base64` > `gif_url` > `image` > barbell icon.
- Clicking a selected exercise toggles it off (removes from selection).

### PWA
- Enabled with `vite-plugin-pwa`, manifest generated, workbox configured for app shell only.
- Exercises JSON chunk excluded from precache via `globIgnores: ['**/assets/exercises-*.js']`.
- `@vitejs/plugin-basic-ssl` used for dev HTTPS (required for camera access).

## Types
- `Exercise` — Firestore document shape with all fields (id, name, category, etc.).
- `EjercicioPlan` — exercise within a Plan, adds `sets`, `fromDataset`, `datasetId`.
- `EjercicioDataset` — extends `Exercise` with `sets`, used in plan form for toggle selection.
- `GymInfo` — flattened persona data (no nested `data` field) plus admin info.

## Key files
- `src/composables/useExercises.ts` — loads exercises from Firestore (with JSON fallback), reactive `exercisesData` ref. No `agregarAEjercicios` — just reload on mutations.
- `src/components/GifRecorder.vue` — records/submits video, generates thumbnail, emits `{ video_base64, image }`.
- `src/views/admin/AdminView.vue` — admin dashboard with personas, planes, custom exercises. Reloads from Firestore after every CUD.
- `src/views/alumno/AlumnoView.vue` — student view: fetches persona & planes directly from Firestore on login. No local data copies stored.
- `src/views/ExercisesBrowserView.vue` — reusable exercise picker with search/filter.
- `src/stores/alumno.ts` — session-only Pinia store (logueado, _dniGuardado). All persona/gym/planes state lives in AlumnoView data.
- `scripts/import-exercises.ts` — one-time script to seed `ejercicios` collection from JSON (batch 200, 2s delay).
