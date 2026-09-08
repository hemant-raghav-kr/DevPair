# DevPair

DevPair is a collaborative platform designed for college students to find teammates for academic projects, hackathons, and open-source initiatives based on complementary skills, shared interests, availability, and project requirements.

## Current Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Backend & Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Linting & Quality**: ESLint 9 + TypeScript Compiler (`tsc`)
- **Deployment Target**: Vercel

## Local Development Prerequisites

- **Node.js**: v20.x or higher (recommended: v24.x LTS)
- **Package Manager**: `npm` (v10+), `pnpm`, or `yarn`
- **Supabase Account**: A Supabase project (for future database tables and authentication)

## Environment Variables Required

DevPair requires the following environment variables. Copy the provided `.env.example` to create your local `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://<project-ref>.supabase.co`) | Public (Browser & Server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Public (Browser & Server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key (never expose to client) | Private (Server-only) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application (e.g., `http://localhost:3000`) | Public (Browser & Server) |

> **Note**: For production deployment on Vercel, configure these variables in **Project Settings > Environment Variables**.

## Basic Run Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Type Checking & Linting

```bash
npm run type-check
npm run lint
```

### 4. Build for Production

```bash
npm run build
npm start
```
