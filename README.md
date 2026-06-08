# 💪 Anbu Protein Tracker

A personal, mobile + laptop meal-planning and macro/gym tracker built from
`Anbu_Protein_Meal_Plan.md`. Local-first (works offline, installs like a real
app) with optional **real-time cloud sync** so your phone and laptop stay in
sync automatically.

## What it does (v2)
- **Today** — a gamified **Mission card** (streak flame, XP/level, next-treat countdown, daily wins) + protein/calorie/water **progress rings**. **One-tap food logging** with a smart search over **180+ foods that auto-fill macros** (offline DB + online lookup via Open Food Facts), a **recents quick-add** strip, and **"✓ Ate the plan"** per meal. Daily **habit chips**, gym log, body weight, notes. Confetti + floating **+XP** + **Undo** on actions.
- **Reward system** — earn **XP & levels**, a forgiving **logging streak**, **achievement badges**, and **cheat-meal / treat unlocks** ("3 more on-target days → Cheat Meal 🍕") that you redeem and re-earn. Designed to pull you back daily (streak-at-risk nudges, evening prompts).
- **Fat-loss goal engine** — enter height/age/weight/target → it computes your **calorie deficit + protein target** (Mifflin-St Jeor) and projects a **timeline + goal-weight line** on the chart.
- **Week** — interactive planner: pick foods into each meal (live macro estimate per day), mark **cooked ✓**, copy/clear days, editable batch-prep **checklist** (auto-resets weekly), one-tap **Share with cook**.
- **Shopping** — quantities, star priorities, check-off, **build from this week's plan**, add/share.
- **Stats** — rewards panel + charts (weight vs goal, protein/day, calories/day with deficit colouring) + KPIs (lost so far, hit-rate, workouts, streak). 7/30/90-day windows. Badges grid + redeemed-treats history.
- **More** — goal setup, cloud sync, food-library manager, JSON backup/restore.

Your data **persists** on the device and (when sync is on) in the cloud, so you can track improvement over weeks/months.

> **Dev tools:** `serve.js` (zero-dep static server, `node serve.js`) and `test.js` (headless jsdom test suite, `node test.js`) are for development only — not needed for deployment.

---

## Run it

### Quick test on your laptop
From this folder, start any static server (the app must be served over http, not opened as a file — service worker + sync need it):

```powershell
# Option A: Python (built in on many machines)
python -m http.server 8080
# then open http://localhost:8080

# Option B: Node
npx serve .
```

### Put it online (so phone + laptop can both reach it)
Deploy these files to any free static host, then open the URL on both devices and **Add to Home Screen** to install it as an app:
- **Cloudflare Pages** / **GitHub Pages** / **Netlify** / **Vercel** — drag-and-drop or connect this folder. No build step; it's plain HTML/JS.

> The app already works fully **without** hosting/sync (data saved per-device). Hosting + sync is what gives you automatic real-time updates across devices.

---

## Turn on real-time sync (≈10 min, free)

1. Create a free project at **https://supabase.com**.
2. In the project: **SQL Editor → New query**, paste the contents of
   [`supabase-schema.sql`](./supabase-schema.sql), and **Run**.
3. Get your keys: **Project Settings → API** → copy the **Project URL** and the
   **anon public** key.
4. In the app: **More → Cloud sync** → paste URL + anon key, set a **Sync ID**
   (any private phrase, e.g. `anbu-secret-2026`), tap **Save & connect**.
5. On your **other device**, open the same app URL and enter the **same** URL,
   key, and **same Sync ID**. Done — edits now sync both ways in real time.

The dot in the header shows status: `local` → `syncing…` → `synced`.

### Is the anon key safe in the app?
The anon key is designed to be public; access is governed by the database
policies in the schema. Because this is a single-user personal app, the policy
allows the app to read/write, and your data is namespaced by your **secret Sync
ID** — treat that ID like a password. Want stronger isolation later? Switch to
Supabase Auth and scope the policies to `auth.uid()`.

---

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell |
| `styles.css` | Styling (mobile-first, dark) |
| `data.js` | Your meal plan: food library, weekly grid, targets, checklists (default seed) |
| `app.js` | All logic: tabs, logging, charts, local storage, Supabase sync |
| `manifest.json`, `sw.js`, `icon.svg` | PWA (installable + offline) |
| `supabase-schema.sql` | Database setup for sync |

## Notes
- Macros come straight from your plan and are **approximate Indian home portions** — edit any in **More → Food library**.
- Not medical advice; see the cautions in your original plan (kidney/metabolic conditions, ADHD meds & appetite).
