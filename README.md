# Gym Tracker 🏋️

A personal, mobile-first PWA to track your **macros** (calories / protein / carbs / fat),
**bodyweight**, and **workouts** — built with Next.js + Tailwind, backed by your own MongoDB.

## Features

- **Dashboard** — today's calories & macros vs your goals (rings + bars), quick-add favorites,
  latest bodyweight + trend, and your last workout, all on one screen.
- **Food** — three ways to log, optimised for *less manual work*:
  - **Favorites** — one-tap log your saved meals (with a quantity stepper).
  - **Search** — search the free [Open Food Facts](https://world.openfoodfacts.org) database
    (values per 100 g; enter grams to log).
  - **Custom** — save your own meals once (e.g. *Protein oats — 569 kcal, 78p*), then they live
    in Favorites forever.
- **Workout** — log exercises with sets (weight × reps); shows **"last time"** for the exercise so
  you can beat it, plus volume & top set.
- **Bodyweight** — log weigh-ins and see a trend chart.
- **Goals** — set your calorie & macro targets and weight unit (kg/lb).
- **PWA** — installable on your phone home screen, works offline for browsing.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then paste your MongoDB URI
npm run dev                        # http://localhost:3000
```

Your `.env.local` needs:

```
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="gymtracker"
APP_PASSWORD="change-me"          # the password you type to sign in
AUTH_SECRET="any-long-random-string"
```

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add Environment Variables: `MONGODB_URI`, `MONGODB_DB`, `APP_PASSWORD`, `AUTH_SECRET`
   (same values as `.env.local`).
4. Deploy. On your phone, open the URL → **Add to Home Screen** to install the app.

### MongoDB Atlas note
Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Vercel's servers can connect.

## Data model (collections)

| Collection | Holds |
|-----------|-------|
| `settings` | `_id: "goals"` (macro targets + unit) and `_id: "auth"` (hashed password + session epoch) |
| `foods` | your saved foods / custom meals (favorites) |
| `log` | each logged food per day (`date: "YYYY-MM-DD"`) |
| `weights` | one weigh-in per day |
| `workouts` | one exercise entry per day with its sets |

## Tech

Next.js 14 (App Router) · Tailwind CSS · MongoDB Node driver · no external chart/UI deps.

## Regenerate app icons

```bash
node scripts/generate-icons.mjs
```

## Login

A single password protects the whole app. The password is **stored hashed (PBKDF2) in MongoDB**,
so you can change it from inside the app — no redeploy.

- **First sign-in:** type the `APP_PASSWORD` from your env once; it's hashed into the DB and that
  env line is then ignored (you can delete it). If you leave `APP_PASSWORD` blank, you'll instead
  set your password on a one-time "create password" screen.
- **Change it later:** Goals → **Change password** (asks for your current one).
- **Stay signed in:** a long-lived, httpOnly cookie signed with `AUTH_SECRET`. **Log out** is at the
  bottom of the Goals screen.
- **Log out all devices:** Goals → **Log out all devices** bumps a session *epoch* stored in the DB,
  which instantly invalidates every existing cookie everywhere (no redeploy needed). The middleware
  reads the current epoch from a tiny public `/api/auth/epoch` endpoint, so it never touches the DB
  driver itself.

`AUTH_SECRET` is a random signing key (not your password) and only needs to be set once. The Edge
middleware verifies the cookie with it, so it never has to touch the database.

> Leave both `APP_PASSWORD` and `AUTH_SECRET` blank to disable login entirely (open app).
