# Project Context

## Stack
- Vue 3 + TypeScript + Vite
- **PocketBase** (self-hosted backend, SQLite + REST API)
- Pinia (admin store only; alumno store is session-only)
- Tailwind CSS
- PWA via vite-plugin-pwa (manifest + app shell only, no data caching)

## Architecture

### Data flow
- All data read/written directly to PocketBase via REST API (`pb.collection().*`). No IndexedDB/Dexie, no offline queue, no dirty flags, no sync.
- After every CUD (create/update/delete), data is re-fetched from PocketBase — no local array mutations.
- Admin authenticates via PocketBase Auth collection (`admins`) using `authWithPassword()`.
- Alumno authenticates via DNI lookup in `persons` collection; session (DNI + gym) saved to localStorage.
- Each admin's data (persons, plans) is scoped by `adminId` field.

### PocketBase Collections
- `admins` — Auth collection (username/password). Identity field: `username`. Fields: `username`, `name`, `logo`.
- `persons` — Base collection. Fields: `name`, `lastName`, `dni` (unique), `address`, `phone`, `adminId`.
- `plans` — Base collection. Fields: `personId`, `adminId`, `name`, `exercises` (JSON array).
- `exercises` — Base collection. Fields: all exercise fields (`name`, `category`, `equipment`, `target`, `muscleGroup`, `gifUrl`, `image`, `videoUrl`, `instructions`, `isCustom`, `adminId`, etc.).
- `categories` — Static seed data (`name`, `label`).
- `muscleGroups` — Static seed data (`name`, `label`).

### Custom exercises
- Created via AdminView with GifRecorder (camera recording or file upload).
- Saved with fields: `name`, `category`, `equipment`, `target`, `muscleGroup`, `image` (JPEG thumbnail), `videoUrl` (Cloudinary URL), `instructions`, `isCustom: true`, `adminId`.
- After saving, `loadCustomExercises()` reloads the list from PocketBase.

### Exercise browser
- Requires ≥4 characters in search text, OR a category/equipment filter selected, before showing results.
- Image precedence: `videoUrl` > `gifUrl` > `image` > barbell icon.
- Clicking a selected exercise toggles it off (removes from selection).

### PWA
- Enabled with `vite-plugin-pwa`, manifest generated, workbox configured for app shell only.
- Exercises JSON chunk excluded from precache via `globIgnores: ['**/assets/exercises-*.js']`.
- `@vitejs/plugin-basic-ssl` used for dev HTTPS (required for camera access).

### Pagination
- Persons list uses PocketBase `getList()` with `PAGE_SIZE = 50`.
- Page number tracked in `personsPage` data property.
- "Cargar más" button loads next page via `getList(nextPage, PAGE_SIZE)`.

## Types
- `Person` — fields: `id`, `name`, `lastName`, `dni`, `address`, `phone`, `adminId`.
- `Plan` — fields: `id`, `personId`, `adminId`, `name`, `exercises` (ExercisePlanEntry[]).
- `Exercise` — all exercise fields, `id` from PocketBase.
- `GymInfo` — flattened persona data plus admin info.
- All records use `id` (PocketBase auto-generated), not `firebaseId`.

## Key files
- `src/db/pocketbase.ts` — PocketBase client initialized from `VITE_PB_URL` env var.
- `src/stores/admin.ts` — uses `pb.collection('admins').authWithPassword()` for login, `pb.authStore` for session restore.
- `src/stores/student.ts` — DNI lookup via `pb.collection('persons').getFullList({ filter })`.
- `src/composables/useExercises.ts` — loads exercises from PocketBase, reactive `exercisesData` ref.
- `src/views/admin/AdminView.vue` — admin dashboard, all CRUD via PocketBase SDK.
- `src/views/student/StudentView.vue` — student view, fetches plans via PocketBase.
- `src/views/ExercisesBrowserView.vue` — reusable exercise picker with search/filter.
- `scripts/setup-pocketbase.ts` — one-time script to create collections. Run: `npm run setup-pocketbase`.

## Environment Variables
- `VITE_PB_URL` — PocketBase server URL (default: `http://localhost:8090`)
- Legacy `VITE_FIREBASE_*` vars kept for reference, no longer used by the app.

## Setup
1. Download and run PocketBase: `pocketbase serve`
2. Create superuser: visit `http://localhost:8090/_/` or use CLI
3. Run `npm run setup-pocketbase` to create collections
4. Create an admin user in the `admins` collection via PocketBase Admin UI
5. Run `npm run dev` to start the app

# Work Log

## 2026-07-30 — Firebase → PocketBase migration

### Done
- Installed `pocketbase` SDK, created `src/db/pocketbase.ts`
- Migrated `src/stores/admin.ts` from Firebase Auth (`signInWithEmailAndPassword`) to PocketBase auth (`authWithPassword` + `pb.authStore`)
- Migrated `src/stores/student.ts` from Firestore queries to `pb.collection('persons').getFullList()`
- Migrated `src/composables/useExercises.ts` to PocketBase
- Migrated `src/views/admin/AdminView.vue`: all CRUD operations replaced (`create`, `update`, `delete`, `getList`). Pagination now uses `getList(page, PAGE_SIZE)` instead of cursor-based (`startAfter`)
- Migrated `src/views/student/StudentView.vue`: `_fetchPlans` uses `getFullList()`
- Renamed `firebaseId` → `id` in `Person`, `Plan`, `GymInfo` types and all usages
- Created `scripts/setup-pocketbase.ts` (`npm run setup-pocketbase`) to create collections programmatically
- Updated `.env` / `.env.example` with `VITE_PB_URL`
- Fully removed Firebase imports from all app source files (only scripts remain)
- Build size reduced ~58% (396KB vs 914KB) by dropping Firebase SDK
- Removed `firebase.ts`, `db/index.ts`, Firebase dependency from `package.json`, legacy scripts, and Firebase env vars

### Pending / next steps
1. Deploy PocketBase on Fly.io (Dockerfile ready in conversation)
2. Migrate existing data from Firebase to PocketBase (script needed — migration done, data may still be in Firebase)
3. Test admin login flow end-to-end
4. Test student DNI lookup flow end-to-end
