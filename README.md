# FinTrack

A personal finance tracker built around a **single source of truth**: your recurring
payments. Edit a payment once and the checklist, per-account splits, and category
breakdowns all update automatically.

## Stack

- **Backend**: ASP.NET Core Web API + Entity Framework Core + SQLite
- **Frontend**: React (Vite) + React Router, plain CSS
- **Runtime**: Docker Compose

## Pages

1. **Home** (`/`) — Today's date, an income / spending / savings / balance summary, an
   interactive checklist and per-account payment lists (tick items off and the account
   total drops), plus spending-by-category, per-account split, and yearly totals.
2. **Checklist** (`/checklist`) — Manage the send/receive routine: description + due day,
   reorder by drag and drop.
3. **Payments** (`/payments`) — Editable, sortable tables for monthly and yearly
   payments. The source of truth: change a value, hit Save, everything recalculates.
4. **Money** (`/money`) — Adjust the manual total balance and manage income sources,
   including scheduled auto-receive.
5. **Settings** (`/settings`) — Enabled banks, payment categories, and backup/restore.

## Running with Docker

```bash
docker compose up --build
```

- App: http://localhost:8080
- Backend API: http://localhost:5099 (proxied through the frontend at `/api`)

The SQLite database is stored in the `fintrack-data` Docker volume, so your data
survives restarts. A fresh install starts empty (only default categories and banks are
seeded) — you add your own data through the app.

## Running locally (without Docker)

```bash
# backend
cd backend/FinTrack.Api
dotnet run --urls http://localhost:5099

# frontend (second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` to the backend on 5099.

## Data model

A single `Payment` drives the app:

| Field | Meaning |
|-------|---------|
| `name` | payment name |
| `account` | account it's paid from (or none) |
| `amount` / `currency` | value and currency |
| `recurrence` | `Monthly` or `Yearly` |
| `category` | spending category |
| `dayOfMonth` / `month` | due day (and month for yearly) |
| `isDone` | checked state for the current cycle |

Income sources, checklist transfers, and settings live in their own tables.

## Backup

Your data lives only in the app's database. Use **Settings → Backup & Restore** to
export everything to a JSON file and to restore from one.

## Notes

- Monthly spending **excludes** yearly payments, even if a yearly payment falls in the
  current month.
- Multi-currency amounts are summed and displayed per currency (never mixed).
