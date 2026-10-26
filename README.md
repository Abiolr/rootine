# Rootine

<img width="1038" height="680" alt="logo" src="https://github.com/user-attachments/assets/6c4c707b-155d-432d-9d06-808c6c32251d" />

> **A habit-building fitness app that turns daily goals into a growing tree.**
>
> Finish your goals and your tree grows. Fall behind and it withers. Daily tasks are verified by your camera using on-device pose detection, and lifetime XP unlocks tree skins that stay unlocked.

Built for the **"Revitalize"** hackathon prompt (MRUHacks 2026).

---

## Table of contents

- [Inspiration](#inspiration)
- [What it does](#what-it-does)
- [Game rules](#game-rules)
- [How it works](#how-it-works)
- [Camera verification and rep counting](#camera-verification-and-rep-counting)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Project structure](#project-structure)
- [Authors](#authors)

---

## Inspiration

Most fitness apps track what you did and leave the motivation to you. Streaks and badges help for a week, then the app becomes another thing to ignore.

Rootine ties your progress to something that visibly responds. Your consistency is a tree: it grows when you show up and withers when you don't. The camera check keeps the daily tasks honest without needing a gym, equipment or a coach in the room.

---

## What it does

- **Camera-verified daily tasks.** Three short bodyweight tasks (push-ups, squats, jumping jacks). A pose model runs in your browser, counts your reps, and only then marks the task done and awards XP.
- **A tree that reflects your progress.** Five states: seed, sapling, juvenile, grown, and dead. The stage is derived from lifetime XP and penalty points.
- **Workout logging.** Start a workout, log sets with exercise, reps and weight, edit or delete them while it's in progress, then finish it to lock it into your history.
- **XP and tree skins.** Lifetime XP unlocks cosmetic skins. Unlocks are based on lifetime XP, so a withered tree never takes away rewards you've already earned.
- **Weekly goal.** Complete 5 workouts in a week for a one-time XP bonus. Miss the target and the week costs you a penalty point.
- **AI coach.** A floating chat widget backed by Claude for programming, technique, recovery and consistency questions.
- **Accounts.** Register, log in and log out. Expired or invalid sessions are cleared and redirected to the login page automatically.

---

## Game rules

### XP

| Action | XP |
|---|---|
| Camera-verified daily task (each of 3) | +20 |
| Completed workout | +5 |
| Weekly goal: 5 completed workouts in a week (one-time) | +100 |

### Tree stages

| Stage | Condition |
|---|---|
| Seed | 0–99 XP |
| Sapling | 100+ XP |
| Juvenile | 400+ XP |
| Grown | 1,000+ XP |
| Dead | 2 or more penalty points (overrides XP) |

### Penalties

A penalty point is added when a week ends with fewer than 5 completed workouts. The check runs when you open the dashboard. Penalty points only affect the tree's **state**. XP is never reduced.

### Tree skins

| Skin | Unlocks at (lifetime XP) |
|---|---|
| Classic | 0 |
| Autumn | 100 |
| Cherry Blossom | 400 |
| Frost | 1,000 |
| Midnight | 2,000 |

Each skin has a sprite per growth stage. The seed stage is background only, and a missing skin sprite falls back to the Classic one.

---

## How it works

1. **Sign up or log in.** `POST /api/auth/login` returns a JWT (24 h expiry) plus your saved XP, penalty points and tree status. The client stores the token and sends it as a `Bearer` header on every protected call.
2. **Load the profile.** On the dashboard, the client refreshes the profile from `GET /api/users/me`, then runs the weekly transition check (which may add a penalty).
3. **Pick a daily task.** Each task opens the camera page (`/tasks/:taskId/camera`).
4. **Detect, count, complete.** MoveNet runs in the browser, the rep counter tracks joint angles frame by frame, and when the target is reached the task is marked done locally and `PATCH /api/users/xp` adds 20 XP. The task is marked done before the XP call, so a failed request can't be retried to farm XP.
5. **The server recomputes the tree.** `calculateTreeStatus(xp, penaltyPoints)` runs on every XP or penalty update, and `GET /api/users/me` self-heals any row whose stored status has drifted from its XP and penalties.
6. **Log workouts.** Start a workout (only one can be in progress at a time), add sets, and finish it. Finished workouts count toward the weekly goal and award XP.
7. **Unlock and equip skins.** Equipping a skin is saved on the device.
8. **Ask the coach.** The chat widget sends the conversation to `POST /api/coach/chat`, which validates it and forwards it to the Anthropic API with the coach system prompt.

---

## Camera verification and rep counting

The camera flow is the technical core of the project.

**Pose estimation.** `client/src/pose.js` loads **MoveNet Lightning** through TensorFlow.js, preferring the WebGL backend and falling back to CPU. The model is lazy-loaded, so TensorFlow only downloads when the camera page opens. Frames whose average keypoint confidence is below 0.2 are treated as "no person in frame". Video never leaves the device in the in-app flow.

**Rep counting.** `client/src/repCounter.js` turns 17 COCO keypoints into reps with a small state machine per exercise:

| Exercise | Signal | Bottom | Top |
|---|---|---|---|
| Push-up | Shoulder–elbow–wrist angle | ≤ 115° | ≥ 145° |
| Squat | Hip–knee–ankle angle | ≤ 125° | ≥ 150° |
| Jumping jack | Arms above/below shoulders and ankle spread vs. shoulder width | Open: arms up, ankles > 1.5× shoulder width | Closed: arms down, ankles < 1.2× shoulder width |

Noise handling for the angle-based exercises:

| Mechanism | Value |
|---|---|
| Joint confidence floor | 0.4 |
| Warm-up before counting | 6 consecutive good frames |
| Tracking reset after losing the joints | 3 bad frames in a row |
| Smoothing | 55% new reading, 45% previous |
| Spike rejection | Jumps over 45° are ignored unless they persist for 3 frames |
| Bottom hold | 2 frames at the bottom before the phase counts |
| Minimum range of motion per rep | 30° |
| Minimum time between reps | 350 ms |

Details worth knowing:

- **One body side at a time.** The tracker uses whichever side (left or right) the model is more confident about, so the user can face the camera from either side.
- **Hysteresis.** Separate bottom and top thresholds mean a rep only counts after a full down-then-up cycle, not when the angle jitters around one value.
- **Aspect-corrected angles.** X coordinates are scaled by the video aspect ratio before computing angles, so non-square video doesn't distort them.
- **User guidance.** If the needed joints aren't visible, the UI shows an exercise-specific hint (for example, "Turn side-on so one arm is fully in frame").

**Standalone vision service.** `vision/cv_service.py` is a FastAPI service running **YOLO11n-pose** (Ultralytics) that accepts a JPEG data URL and returns normalized keypoints for the strongest detected person. It returns the same keypoint shape as the in-browser path and has a manual test page (`vision/workout_test.html`) for tuning thresholds. The in-app camera flow runs on-device and does not call it.

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Front end | React 19 + Vite | React Router for routing, route guard on every authenticated page |
| In-browser pose detection | TensorFlow.js + `@tensorflow-models/pose-detection` (MoveNet Lightning) | `@mediapipe/pose` is aliased to a stub in `vite.config.js` because the pose-detection package imports it for the MediaPipe runtime, which isn't used here |
| Back end | Node.js 20 + Express 5 | ES modules |
| Database | PostgreSQL 16 | `postgres:16-alpine` in Docker Compose |
| ORM | Prisma 7 with the `pg` driver adapter | Migration history checked in |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` | 24 h tokens, bcrypt hashing with 10 salt rounds |
| AI coach | Anthropic API (`@anthropic-ai/sdk`) | Model set by `CLAUDE_MODEL`, default `claude-haiku-5-5` |
| Vision service | Python, FastAPI, Ultralytics YOLO11n-pose, OpenCV | CPU-only PyTorch wheels |
| Containerization | Docker + Docker Compose | Server image runs `prisma migrate deploy` before starting |
| Hosting | Railway (API, database, vision service) | The client includes a `vercel.json` with SPA rewrites for static hosting |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  React client (Vite, TF.js)                  │
│  Dashboard · TaskCamera · Workout · Cosmetics · Coach widget │
│  MoveNet pose detection + rep counter run in the browser     │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS / JSON  (Authorization: Bearer <JWT>)
┌───────────────────────────▼──────────────────────────────────┐
│                       Express API                             │
│  auth · users (xp, penalty) · workouts · sets · coach         │
└─────────────┬───────────────────────────────┬────────────────┘
              │ Prisma (pg adapter)           │ Anthropic SDK
┌─────────────▼──────────────┐     ┌──────────▼─────────────────┐
│  PostgreSQL                │     │  Anthropic API             │
│  User · Workout · Set      │     │  (coach replies)           │
└────────────────────────────┘     └────────────────────────────┘

        ┌────────────────────────────────────────────┐
        │ vision/ (FastAPI + YOLO11n-pose)           │
        │ Standalone pose service + manual test page │
        └────────────────────────────────────────────┘
```

### Request flow: completing a daily task

```
User taps "Do 5 push ups" → /tasks/pushups/camera
    ↓
getUserMedia → video frames → MoveNet (in browser)
    ↓
17 keypoints → createCounter("pushup").update(...)
    ↓
Reps reach the target → completeDaily(id) marks it done locally
    ↓
PATCH /api/users/xp { amount: 20 } → userController.addXp
    ↓
calculateTreeStatus(xp, penaltyPoints) → status saved with the new XP
    ↓
Updated profile returned → client cache refreshed → dashboard re-renders the tree
```

---

## Data model

### Enums

| Enum | Values |
|---|---|
| `TreeStatus` | `SEED`, `SAPLING`, `JUVENILE`, `GROWN`, `DEAD` |
| `WorkoutStatus` | `IN_PROGRESS`, `COMPLETED` |

### `User`
| Column | Type | Description |
|---|---|---|
| `userId` | UUID | Primary key |
| `username` | String | Unique |
| `password_hash` | String | bcrypt hash, never returned by the API |
| `display_name`, `bio`, `avatar_url` | String? | Optional profile fields |
| `xp` | Int | Lifetime XP, default 0 |
| `penalty_points` | Int | Default 0 |
| `status` | `TreeStatus` | Derived from `xp` and `penalty_points`, default `SEED` |
| `creation_date` | DateTime | Default now |

### `Workout`
| Column | Type | Description |
|---|---|---|
| `workoutId` | UUID | Primary key |
| `userId` | UUID | FK → `User.userId` |
| `startTime` | DateTime | Default now |
| `endTime` | DateTime? | Set on completion |
| `status` | `WorkoutStatus` | Default `IN_PROGRESS` |

### `Set`
| Column | Type | Description |
|---|---|---|
| `setId` | UUID | Primary key |
| `workoutId` | UUID | FK → `Workout.workoutId` |
| `exercise` | String | Exercise name |
| `sets` | Int | Number of sets |
| `reps` | Int | Reps per set |
| `weightKg` | Float? | Optional load |
| `date` | DateTime | Default now |

The schema evolved through three migrations: `init` (users), `add_tree_progression` (XP, penalties, status), and `add_workout_sessions` (workouts and sets).

---

## API reference

All routes except the public ones require `Authorization: Bearer <token>`. Errors are returned as `{ "error": "..." }` with an appropriate status code, and internal details are only logged server-side.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | API identity check |
| GET | `/api/health` | — | Runs `SELECT 1` against PostgreSQL. `200` when connected, `503` otherwise |
| POST | `/api/auth/register` | — | Create an account. `201` on success, `409` if the username exists |
| POST | `/api/auth/login` | — | Returns `token`, `userId`, `username`, `xp`, `penalty_points`, `status`. `401` on bad credentials |
| POST | `/api/auth/logout` | ✓ | Acknowledges logout (tokens are stateless, the client discards it) |
| GET | `/api/auth/me` | ✓ | Returns the decoded token payload |
| GET | `/api/users/me` | ✓ | Saved profile. Heals any drifted `status` before returning |
| PATCH | `/api/users/xp` | ✓ | Body `{ amount }` (positive number). Adds XP and recomputes status |
| PATCH | `/api/users/penalty` | ✓ | Body `{ amount }` (positive number). Adds penalty points and recomputes status |
| POST | `/api/workouts/start` | ✓ | Starts a workout. `409` if one is already in progress |
| PATCH | `/api/workouts/:id/complete` | ✓ | Completes your own workout. `404` if not found or not yours, `400` if already completed |
| POST | `/api/sets` | ✓ | Log a set on an in-progress workout you own |
| PATCH | `/api/sets/:id` | ✓ | Update a set. Only whitelisted fields are accepted. `400` once the workout is completed |
| DELETE | `/api/sets/:id` | ✓ | Delete a set. `400` once the workout is completed |
| POST | `/api/coach/chat` | ✓ | Body `{ messages: [{ role, content }] }`, returns `{ reply }` |

### Coach endpoint rules

- `messages` must be a non-empty array of at most 30 entries.
- Each message needs a `role` of `user` or `assistant` and a non-empty string `content` of at most 4,000 characters.
- The first and last messages must be from the user.
- Only `role` and `content` are forwarded, so clients can't inject extra fields.
- Anthropic rate limits map to `429` ("Coach is busy right now") and other upstream failures to `502`.

The coach system prompt (`server/src/prompts/coach.prompt.js`) keeps answers short, stays within fitness, training, recovery and basic nutrition, declines medical, extreme-diet and performance-enhancing-drug advice, and tells users to stop and seek care for warning symptoms like chest pain or dizziness.

Example:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "abiola", "password": "your-password"}'
```

```json
{
  "token": "eyJ...",
  "userId": "…",
  "username": "abiola",
  "xp": 120,
  "penalty_points": 0,
  "status": "SAPLING"
}
```

---

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL container), or any PostgreSQL instance
- Python 3.10+ (only for the optional vision service)
- An Anthropic API key (for the coach)

### 1. Database

```bash
cd server
docker compose up -d db
```

### 2. Server

Create `server/.env`:

```env
DATABASE_URL=postgresql://rootine_user:supersecret@localhost:5432/rootine_db?schema=public
PORT=3000
JWT_SECRET=change-me
ANTHROPIC_API_KEY=your-key-here
# Optional, defaults to claude-haiku-5-5
# CLAUDE_MODEL=claude-haiku-5-5
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify tokens |
| `ANTHROPIC_API_KEY` | For the coach | Anthropic API key |
| `CLAUDE_MODEL` | No | Coach model, defaults to `claude-haiku-5-5` |
| `PORT` | No | Defaults to `5000` |

Install, apply migrations and run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

> The server defaults to port `5000` and the client defaults to `http://localhost:3000`. Either set `PORT=3000` as above, or point the client at the port you use with `VITE_API_URL`.

### 3. Client

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The camera needs a secure context, so use `localhost` or HTTPS.

### 4. Vision service (optional)

```bash
cd vision
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn cv_service:app --port 8000
```

The YOLO11n-pose weights download on first run. Open `vision/workout_test.html` in a browser to try the service and tune rep-counting thresholds against it.

---

## Deployment

- **API and database.** The server `dockerfile` builds on `node:20-slim`, installs OpenSSL for Prisma, generates the client, and starts with `npx prisma migrate deploy && npm start`, so schema migrations apply on every deploy. The API exposes `/api/health`, which checks the database connection for uptime monitoring.
- **Local containers.** `server/docker-compose.yml` runs the API on port `5000` with a `postgres:16-alpine` database behind a `pg_isready` health check, and a persistent `pgdata` volume. The API container waits for the database to be healthy before starting.
- **Vision service.** Deployed as its own service. `VITE_VISION_URL` configures where the client's optional `detectPose` helper points.
- **Client.** A standard Vite build (`npm run build`). `vercel.json` rewrites all routes to `index.html` so client-side routes like `/dashboard` work on refresh.

---

## Known limitations

- **XP and penalties are client-asserted.** `PATCH /api/users/xp` and `/api/users/penalty` accept any positive amount from an authenticated user, and camera verification runs in the browser, so a determined user can award themselves XP. The right fix is to award XP server-side from validated events.
- **No revive path yet.** Penalty points only ever increase, and two or more mark the tree as dead. There is currently no endpoint or rule that brings a withered tree back, even though that is the intended mechanic.
- **Progress state is stored in the browser.** Daily task completion, the weekly workout counter, workout history and the equipped skin live in `localStorage`, so they are per device and reset if storage is cleared. There is no "list workouts" endpoint yet.
- **Penalties are applied lazily.** The weekly check runs when the dashboard loads and applies at most one penalty per load.
- **The dashboard's day counter is a placeholder.** There is no backend field for tree age yet.
- **Jumping-jack counting is untested.** Push-up and squat tracking were tuned on the test page. Jumping jacks use simpler position rules and have not been tuned. All three work best with the camera placed side-on, 2–3 metres away, with the whole body in frame.
- **The coach is stateless.** It only sees the current conversation, can't read logged workouts, doesn't use retrieval, and conversations are not stored.
- **Security basics are minimal.** There is no rate limiting, no password rules or request-body validation on registration, CORS is open, and logout only clears the token client-side.
- **No automated tests or CI yet.** `npm test` is still the default placeholder.
- **Compose is dev-only.** `docker-compose.yml` has development database credentials hard-coded and only sets `DATABASE_URL` and `PORT`. Add `JWT_SECRET` and `ANTHROPIC_API_KEY` (for example with an `env_file`) before using it for anything beyond local testing.

---

## Project structure

```
rootine/
├── client/                         React front end (Vite)
│   ├── index.html
│   ├── vercel.json                 SPA rewrites
│   ├── vite.config.js              Includes the @mediapipe/pose stub alias
│   └── src/
│       ├── App.jsx                 Routes, route guards, task and XP wiring
│       ├── api.js                  API client, token and profile storage
│       ├── Frontpage.jsx           Landing page
│       ├── LoginPage.jsx           Log in
│       ├── RegisterPage.jsx        Create an account
│       ├── AuthLayout.jsx          Shared auth page layout
│       ├── Dashboard.jsx           Tree, status, daily and weekly tasks
│       ├── TaskCamera.jsx          Camera flow, skeleton overlay, task completion
│       ├── pose.js                 MoveNet (TF.js) loading and detection
│       ├── repCounter.js           Angle trackers and jumping-jack logic
│       ├── tasks.js                Task definitions, daily/weekly state, weekly penalty check
│       ├── Workout.jsx             Workout and set logging
│       ├── workoutData.js          Exercise list for the workout picker
│       ├── Cosmetics.jsx           Skins and XP progress
│       ├── skins.js                Skin definitions and sprite lookup
│       ├── progression.js          Tree stage thresholds (mirrors the server)
│       ├── Chatbot.jsx             Floating AI coach widget
│       └── mediapipePoseStub.js    Stub for the unused MediaPipe runtime
├── server/                         Express API
│   ├── dockerfile
│   ├── docker-compose.yml          API + PostgreSQL for local use
│   ├── prisma/
│   │   ├── schema.prisma           User, Workout, Set
│   │   └── migrations/             init, add_tree_progression, add_workout_sessions
│   └── src/
│       ├── server.js               Entry point
│       ├── app.js                  Express setup, health check, route mounting
│       ├── config/db.js            Prisma client with the pg adapter
│       ├── middlewares/
│       │   └── auth.middleware.js  JWT verification
│       ├── routes/                 auth, users, workouts, sets, coach
│       ├── controllers/            Request handlers
│       ├── prompts/
│       │   └── coach.prompt.js     Coach system prompt
│       └── utils/
│           └── progression.util.js Tree status calculation
└── vision/                         Standalone pose service
    ├── cv_service.py               FastAPI + YOLO11n-pose
    ├── requirements.txt
    └── workout_test.html           Manual test page
```

---

## Authors

- Abiola Raji
- Tarun Jaswal
- Jacky On
- Ochihai Omuha
