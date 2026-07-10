# Rocco's Pizza — QR Ordering System

A production-quality, zero-app restaurant ordering system. Customers scan a QR code at
their table, order from a beautiful mobile menu, and watch their order move through the
kitchen in real time. Chefs manage the queue from a kitchen display. Managers run the
whole restaurant — menu, orders, reports, and QR codes — from one dashboard.

Built with **Next.js 14, React, TailwindCSS, Supabase (Postgres + Auth + Realtime), and
Vercel** — all on free tiers.

---

## What's inside

| Area | What it does |
|---|---|
| `/table/[id]` | Customer menu for a specific table. No login. |
| `/order/[id]` | Live order tracking with a realtime status timeline. |
| `/chef/login`, `/chef/dashboard` | Kitchen display — accept, prepare, ready, serve, cancel. |
| `/manager/login`, `/manager/dashboard` | KPIs: sales, orders, avg order value, top sellers, ratings. |
| `/manager/menu` | Add/edit/delete categories and menu items, toggle availability. |
| `/manager/orders` | Search and filter every order by status, table, or date. |
| `/manager/reports` | Charts + CSV/PDF export: daily sales, peak hours, category revenue, best/worst sellers. |
| `/manager/qrcodes` | Generates and downloads a QR code for every table. |
| `supabase/schema.sql` | Full normalized database schema with Row Level Security. |
| `supabase/seed.sql` | 30 tables, 42 menu items across 7 categories, demo orders and reviews. |

## Roles

- **Customer** — anonymous, identified only by the table they scanned.
- **Chef** — email/password login, sees the kitchen display only.
- **Manager** — email/password login, sees everything including the kitchen display.

Route access is enforced two ways: Next.js middleware checks the session on every
request, and Postgres Row Level Security enforces the same rules at the database level
— so even a direct API call can't bypass the rules.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Full deployment guide

See **DEPLOYMENT.md** for a complete, click-by-click walkthrough covering Supabase,
GitHub, and Vercel — written for someone who has never deployed a website before.

## Notes on scope

This is a complete, working reference implementation of every flow in the brief. A
couple of pieces are intentionally left as simple, swappable stubs so the project stays
easy to run on free tiers:

- **Menu images** are set via a URL field (Unsplash links in the seed data). Wiring up
  Supabase Storage for direct image uploads is a small addition — see the "Optional:
  image uploads" section in DEPLOYMENT.md.
- **"Top 10 Customers"** in reports is implemented as **Top Tables by Spend**, since
  customers never create an account in a zero-app, no-login system — there's no
  identity to group by. If you want real customer accounts, that's a bigger change
  (adding an optional login/phone-number step to checkout).
