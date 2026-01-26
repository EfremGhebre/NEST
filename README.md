# NEST

NEST is a personal content hub for Books, Quotes, Movies, Diaries, and Activities. It includes authentication, rich card views, tagging, and searchable collections.

## Features

- Auth (register/login) with JWT
- CRUD for Books, Quotes, Movies, Diaries, Activities
- Tags, ratings, status, notes, and metadata
- Light/dark theme with responsive layouts

## Tech Stack

- Frontend: Angular
- Backend: Node.js + Express
- Database: Postgres (Supabase) in production, SQLite in local dev

## Local Development

### 1) Backend

From `server/`:

```
npm install
```

Create `server/.env`:

```
DB_ENGINE=sqlite
DB_PATH=bnq.db
JWT_SECRET=dev_secret
```

Start API:

```
npm run start
```

API runs on `http://localhost:3000`.

### 2) Frontend

From repo root:

```
npm install
npm start
```

App runs on `http://localhost:4200` and proxies `/api` to the backend via `proxy.conf.json`.

## Production

### Backend (Render)

Set environment variables:

- `DATABASE_URL` (Supabase connection string or pooler URI)
- `JWT_SECRET`
- `FRONTEND_ORIGIN` (Vercel URL)

Start command:

```
npm start
```

### Frontend (Vercel)

Build command:

```
npm run build
```

Output directory:

```
dist/bn-q
```

Make sure `src/environments/environment.prod.ts` points to the Render API URL.

## Scripts

Root:

- `npm start`: Angular dev server (with proxy)
- `npm run build`: Production build

Server:

- `npm run start`: Start API
- `npm run dev`: Start API with nodemon
