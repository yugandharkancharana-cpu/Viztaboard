# Vizta Board — Admin Web App

Next.js 14 (App Router) admin panel for the Vizta Board billboard booking platform.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Auth | Clerk (`@clerk/nextjs`) |
| Server state | TanStack React Query v5 |
| Client state | Zustand v4 |
| Icons | Lucide React |
| HTTP client | Axios |
| Linting | ESLint + `@typescript-eslint` |
| Formatting | Prettier + `prettier-plugin-tailwindcss` |

## Quick start

```bash
# 1. Clone and enter
git clone <repo>
cd vizta-board-web

# 2. Install dependencies
npm install

# 3. Set environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, etc.

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

## Project structure

```
src/
├── app/                   # Next.js App Router
│   ├── (auth)/            # Sign-in / sign-up (no sidebar)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── layout.tsx     # Sidebar + header shell
│   │   ├── page.tsx       # Dashboard home
│   │   ├── billboards/    # Billboard CRUD
│   │   ├── bookings/      # Booking management & approvals
│   │   ├── finance/       # Invoices & settlements
│   │   └── analytics/     # Revenue & occupancy charts
│   ├── api/health/        # Health-check endpoint
│   ├── globals.css        # Design tokens + Tailwind base
│   └── layout.tsx         # Root layout (Providers)
├── components/
│   ├── layout/            # Sidebar, Header, Providers
│   ├── billboards/        # Billboard-specific UI
│   ├── bookings/          # Booking-specific UI
│   └── ui/                # Shared base components
├── hooks/                 # React Query hooks per domain
├── lib/
│   ├── api-client.ts      # Axios instance + typed helpers
│   ├── query-keys.ts      # Centralised cache key factory
│   └── utils.ts           # cn(), formatCurrency(), etc.
├── store/
│   └── app-store.ts       # Zustand — sidebar + toasts
├── types/                 # TypeScript interfaces (mirrors DB schema)
└── middleware.ts           # Clerk auth guard
```

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all files |
| `npm run type-check` | TypeScript check (no emit) |

## Environment variables

See `.env.local.example` for all required variables.

## API integration

All API calls go through `src/lib/api-client.ts`. It:
- Points to `NEXT_PUBLIC_API_URL` (Django backend)
- Attaches the Clerk JWT on every request
- Unwraps the DRF envelope `{ data, meta, errors }`
- Redirects to `/sign-in` on 401

React Query hooks in `src/hooks/` consume the client. Add a new domain:
1. Add types to `src/types/`
2. Add query keys to `src/lib/query-keys.ts`
3. Create `src/hooks/use-<domain>.ts`
4. Build the page in `src/app/(dashboard)/<domain>/page.tsx`

## VS Code

Open the folder in VS Code and accept the **Recommended Extensions** prompt (`.vscode/extensions.json`).

Press `F5` → **Next.js: fullstack debug** to start the dev server with the Chrome debugger attached.
