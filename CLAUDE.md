# Lanson Quotation & Discount Module (Standalone PWA)

## Overview
Mobile-first PWA for Lanson Toyota sales team to share vehicle price lists via WhatsApp, request multi-tier discount approvals, and generate quotations.

## Tech Stack
- React + Vite + TypeScript + Tailwind CSS v4
- Supabase (shared project: `qqqadwnmckljslyteptq` / margin-analysis)
- vite-plugin-pwa for offline support

## Project Structure
- `src/components/` — auth, layout, dashboard, price-list, discount, quotation, customer, notifications, common
- `src/hooks/` — usePriceList, useDiscountRequests, useCustomers, useQuotations, usePushNotifications
- `src/lib/` — supabase client, constants, roles, formatters (INR), whatsapp (wa.me), validators (Zod)
- `src/context/` — AuthContext (email+PIN auth), NotificationContext (Supabase Realtime)
- `supabase/migrations/` — 16 migration files
- `supabase/functions/` — create-user, process-discount-approval, send-push, upload-price-list

## Database
All tables prefixed `3_disc_` (consolidated from former `1_dm_` prefix) to avoid conflicts with other apps on same Supabase project.
11 tables: branches, profiles, vehicle_models, vehicle_variants, price_lists, price_list_items, customers, discount_requests, approval_log, quotations, notifications.

## Auth
Email + 6-digit PIN login. Email format: `name+lmid@lanson.com` (e.g., `ravi1001@lanson.com`).
Test accounts (PIN: 123456): ravi1001@lanson.com (Sales Officer), shyam2001@lanson.com (Sales VP), admin9001@lanson.com (Admin).

## Discount Routing
Auto-routes by amount: ≤30K→Sales VP, 30K-2L→COO, >2L→JMD/MD.

## Deployment
- GitHub: https://github.com/akumarresh-wq/lanson-quotation-pwa
- Vercel: auto-deploys from main branch
- Also integrated into lanson-app at `/discount-module/` (Next.js version)

## Running Locally
```
npm run dev  # http://localhost:5173
```

## Browser Automation
For any scraping, browser interaction, or web automation task, use the Playwright skill at `.claude/skills/playwright/`. See `SKILL.md` there for conventions. Scripts go in `scripts/`, must output JSON only, and are run via `node .claude/skills/playwright/scripts/run.js <script-name>`.
