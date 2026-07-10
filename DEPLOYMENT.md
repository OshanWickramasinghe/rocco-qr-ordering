# Deployment Guide — Rocco's Pizza QR Ordering System

This guide assumes you've never deployed a website before. Every step tells you exactly
what to click. It takes about 30–40 minutes the first time.

You will use three free services:
1. **GitHub** — stores your code
2. **Supabase** — your database, login system, and realtime engine
3. **Vercel** — hosts your website so anyone can visit it

---

## Part 1 — Put the code on GitHub

1. Go to **https://github.com** and sign in (or create a free account).
2. Click the **+** icon in the top-right corner → **New repository**.
3. Name it `rocco-qr-ordering`. Leave it **Public** or **Private**, either works.
4. Do **not** check "Add a README" — this project already has one.
5. Click **Create repository**.
6. On the next page, GitHub shows you commands under "…or push an existing repository
   from the command line." Open a terminal on your computer, `cd` into the project
   folder you downloaded, and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rocco-qr-ordering.git
   git push -u origin main
   ```
7. Refresh the GitHub page — your files should now be listed.

---

## Part 2 — Create your Supabase project (database + auth + realtime)

1. Go to **https://supabase.com** and click **Start your project** → sign in with
   GitHub (easiest) or email.
2. Click **New project**.
3. Fill in:
   - **Name**: `rocco-pizza`
   - **Database Password**: click "Generate a password" and **save it somewhere safe**
     (a password manager or a note). You won't need to type it often, but keep it.
   - **Region**: pick the one closest to your restaurant.
4. Click **Create new project**. Wait 1–2 minutes while Supabase sets things up.

### 2.1 Run the database schema

1. In the left sidebar, click the **SQL Editor** icon (looks like `</>`).
2. Click **New query**.
3. Open `supabase/schema.sql` from the project folder on your computer, copy its
   entire contents, and paste it into the SQL editor.
4. Click **Run** (bottom-right, or `Ctrl+Enter` / `Cmd+Enter`).
5. You should see "Success. No rows returned." If you see a red error, re-check that
   you copied the *entire* file, then click Run again.

### 2.2 Load the demo menu and sample orders

1. Still in the SQL Editor, click **New query** again.
2. Open `supabase/seed.sql`, copy everything, paste it in, and click **Run**.
3. This adds 30 tables, 42 menu items with photos, a few demo orders in different
   statuses, and some sample reviews — perfect for a live demo.

### 2.3 Create your Chef and Manager logins

1. In the left sidebar, click **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter an email (e.g. `manager@roccospizza.com`) and a password. Leave
   "Auto Confirm User" **checked** so you don't need to verify by email.
4. Click **Create user**.
5. Click on the user you just created and **copy their User UID** (a long string of
   letters and numbers) — you'll need it in a moment.
6. Repeat steps 2–5 to create a second user for the chef, e.g. `chef@roccospizza.com`.
7. Go back to **SQL Editor** → **New query**.
8. Open `supabase/create-staff-profiles.sql`, and replace the two placeholder UUIDs
   with the real User UIDs you copied — one row with `'manager'` as the role for your
   manager account, one row with `'chef'` for your chef account. Paste the edited SQL
   in and click **Run**.
9. These two accounts can now log in at `/manager/login` and `/chef/login` on your
   live site.

### 2.4 Copy your API keys

1. In the left sidebar, click the **Settings gear icon** → **API**.
2. You'll see:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon public** key — a long string under "Project API keys"
   - **service_role** key — another long string (keep this one secret, never put it in
     frontend code)
3. Keep this tab open — you'll paste these into Vercel in Part 3.

---

## Part 3 — Deploy to Vercel

1. Go to **https://vercel.com** and click **Sign Up** → **Continue with GitHub**.
2. Once signed in, click **Add New…** → **Project**.
3. Find `rocco-qr-ordering` in the list (you may need to click **Adjust GitHub App
   Permissions** and grant Vercel access to the repo) and click **Import**.
4. On the "Configure Project" screen:
   - **Framework Preset**: should auto-detect as **Next.js** — leave it.
   - Expand **Environment Variables** and add these three, pasting the values you
     copied from Supabase in step 2.4:

     | Name | Value |
     |---|---|
     | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
     | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
     | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |

5. Click **Deploy**. Vercel will build and publish your site — this takes 1–2 minutes.
6. When it finishes, click **Continue to Dashboard**, then click **Visit** to open your
   live site — something like `https://rocco-qr-ordering.vercel.app`.

**That's it — your system is live.** Every table's QR code will point to
`https://your-site.vercel.app/table/1`, `/table/2`, and so on.

---

## Part 4 — Print your QR codes

1. Visit `https://your-site.vercel.app/manager/login` and sign in with the manager
   account you created in step 2.3.
2. Click **QR Codes** in the sidebar.
3. Click **Download All** (or download them one at a time), then print and place one
   QR code on each physical table.

---

## Part 5 — Every time you make a change

Because your code lives on GitHub and Vercel watches it automatically:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

Vercel redeploys automatically within a minute or two — no dashboard clicks needed.

---

## Optional: image uploads via Supabase Storage

The demo ships with Unsplash photo links so it looks great out of the box. To let
managers upload their own photos instead of pasting URLs:

1. In Supabase, go to **Storage** → **New bucket** → name it `menu-images` → make it
   **Public**.
2. In `/manager/menu`, replace the "Image URL" text field with a file `<input
   type="file">` that uploads to `supabase.storage.from('menu-images').upload(...)`
   and saves the returned public URL to `image_url`. The Supabase docs at
   https://supabase.com/docs/guides/storage have a copy-paste example for this.

## Troubleshooting

- **"Invalid API key" on the live site** — double check the three environment
  variables in Vercel → your project → **Settings** → **Environment Variables**, then
  redeploy (Vercel → **Deployments** → **···** → **Redeploy**).
- **Chef/manager login redirects back to the login page** — the account's role wasn't
  set. Re-check step 2.3: the `profiles` table needs a row with the matching `id` and
  the correct `role`.
- **Orders don't update in real time** — confirm `schema.sql` ran successfully; it
  includes the two `alter publication supabase_realtime add table …` lines that turn
  realtime on for orders.
