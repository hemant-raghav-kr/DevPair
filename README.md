<div align="center">

# DevPair

**The Intelligent Peer Matching & Collaborative Project Lifecycle Platform for College Students**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel)](https://dev-pair-delta.vercel.app)

[Live Production Demo](https://dev-pair-delta.vercel.app) · [Report Bug](https://dev-pair-delta.vercel.app/contact) · [Architecture](#system-architecture)

</div>

---

## Overview

Finding reliable, skilled collaborators for college hackathons, capstone projects, and open-source initiatives is traditionally fragmented and unreliable. Students rely on chaotic group chats, face unpredictable skill mismatch, and suffer from ghosting or flaking after team formation.

**DevPair** solves this with a purpose-built collaborative platform featuring:
1. **Algorithmic & Machine Learning Teammate Matchmaking**: Transparent compatibility scores based on skill overlap, category alignment, and verified commitment.
2. **Atomic Project & Team Lifecycle Management**: Role slot reservations enforced via PostgreSQL database triggers, preventing over-recruitment race conditions.
3. **Commitment Protection via Withdrawal Cooldowns**: Voluntary application withdrawals incur a 3-day cooldown to prevent frivolous join/leave loops, while project owner removals never penalize students.
4. **Restriction Revocation & Appeals System**: In-app appeal mechanisms for active user suspensions and withdrawal cooldowns with an administrative review queue.
5. **Multi-Tiered Administrative Governance**: Role hierarchy (Canonical Super Admin $\rightarrow$ Subordinate Admin $\rightarrow$ Student) with non-recursive Row-Level Security and tamper-proof internal audit logging.
6. **Real-Time Notification Pipeline**: Instant Supabase Realtime alerts for join requests, team status changes, moderation events, and appeal outcomes.
7. **User-Controlled Appearance**: Explicit Dark / Light mode preference with persistent storage, defaulting to dark mode.

---

## Key Features

### 1. Intelligent Matchmaking & Discovery (`/discover`)
- **Deterministic & ML Compatibility Scoring**: Analyzes student portfolios against project role specifications.
  - **Skill Match Weight (50%)**: Direct and tangential technology match with proficiency levels.
  - **Interest Overlap Weight (30%)**: Project domain alignment (AI/ML, Web3, Systems, Mobile, Cloud, etc.).
  - **Availability & Bandwidth Weight (20%)**: Weekly available hours and graduation timeline compatibility.
- **Explainable Match Insights**: Highlights exact matching competencies (`✓`) alongside areas for growth (`△`).
- **Discovery Engine**: Multi-parameter search by tech stack, project status (`recruiting`, `in_progress`, `completed`), hackathon flags, and college affiliation.

### 2. Application & Team Lifecycle (`/applications`, `/projects/[id]`)
- **Technical Role Slots**: Project owners define specialized openings with required skills and slot caps.
- **Race-Condition-Proof Capacity**: PostgreSQL triggers guarantee team capacity limits are never breached during simultaneous applications.
- **Voluntary Student Withdrawal**: Students can withdraw join requests at any point—both while **pending** and after being **accepted** on the active roster.
- **3-Day Anti-Flake Cooldown**: Voluntary withdrawal initiates a 3-day cooldown period during which new applications are blocked by database constraints.
- **Project Owner Team Removal**: Owners can remove team members cleanly, automatically freeing the role slot for new applicants without triggering a student penalty.

### 3. Restriction Revocation & Appeals System (`/banned`, `/admin/revocation-requests`)
- **Student-Facing Appeals**:
  - **Suspended Users (`/banned`)**: View suspension rationale and submit a structured appeal explaining their case.
  - **Cooldown Appeals (`/applications`)**: Request early cooldown revocation with justification (e.g., imminent hackathon submission deadlines).
- **Duplicate Prevention**: Database partial unique indexes strictly limit users to a single pending appeal per restriction type.
- **Administrative Review Queue (`/admin/revocation-requests`)**: Dedicated operational dashboard for administrators to filter, examine, approve, or reject appeals with logged administrative feedback.
- **Automated Restorations**: Approving a ban appeal immediately deletes the active ban; approving a cooldown appeal revokes the cooldown across database constraints and notifies the student.

### 4. Enterprise-Grade Moderation & Governance (`/admin`)
- **Role Hierarchy**:
  - **Canonical Super Admin**: Full platform oversight; permanent immutability enforced by PostgreSQL trigger (cannot be deleted, deactivated, or demoted).
  - **Subordinate Admin**: Operational management (student moderation, project review, complaints resolution, appeal processing).
  - **Student**: Normal platform privileges under Row-Level Security (RLS).
- **Internal Audit Logging (`/admin/audit-logs`)**: Complete chronological audit trail capturing withdrawals, cooldowns, owner removals, and appeal reviews.
- **Community Safety (`/admin/complaints`)**: User report submission, review states (`pending`, `reviewed`, `dismissed`), and actionable moderation.

### 5. UI/UX & Appearance System
- **Theme Preference Toggle**: Persistent Dark / Light mode selector in navigation, decoupled from operating system light preferences.
- **Mobile Responsive**: Fully responsive layout with custom drawer navigation, backdrop-blurred modals, and touch-friendly controls.
- **DevPair Visual Identity**: Unified branded iconography and SVGs across student and admin viewports.

---

## Machine Learning Architecture

```
                 [ Offline Training Pipeline (Python) ]
+-------------------------+      +-------------------------+
| Synthetic Data Generator| ---> |  Logistic Regression    |
| (Student/Role Vectors)  |      |  (scikit-learn, L-BFGS) |
+-------------------------+      +-------------------------+
                                              |
                                     Model Coefficients
                                   (Weights + Intercept)
                                              |
                                              v
                 [ Online Runtime Inference (TypeScript) ]
+-------------------------+      +-------------------------+      +-----------------------+
|  Live Student Profile   | ---> | In-Memory Linear Dot    | ---> | Sigmoid Normalization |
|  & Project Role Entity  |      | Product Calculation     |      | P ∈ [0.0, 1.0] (0-100)|
+-------------------------+      +-------------------------+      +-----------------------+
```

- **Runtime Execution**: Serialized model parameters execute directly within Next.js Server Components in pure TypeScript.
- **Zero Python Runtime Overhead**: No external microservice or container is required in production, ensuring instant response times and 100% Vercel serverless compatibility.
- **Evaluation Metrics**: Evaluated on held-out validation sets with **97.6% accuracy**, **96.7% precision**, and **0.996 ROC-AUC**.
- **Model Evolution**: Bootstrapped initially on mathematically modeled synthetic student-project interactions; designed for progressive retraining on live platform application outcomes (`status = 'accepted' | 'rejected'`).

---

## System Architecture

```
                                  [ Client Browser ]
                                          |
                      HTTPS / WSS (Supabase Realtime Notifications)
                                          |
                                          v
                              [ Next.js 15 App Router ]
                     (Server Components, Server Actions, Route Handlers)
                           |                             |
                 [ Public & Student Views ]      [ Admin / Super Admin ]
                 - /discover, /projects          - /admin/users, /audit-logs
                 - /applications, /banned        - /admin/revocation-requests
                           |                             |
                           +--------------+--------------+
                                          |
                                          v
                              [ PostgreSQL 15 Database ]
                   +-----------------------------------------------+
                   | Row-Level Security (RLS) Policies             |
                   | Triggers:                                     |
                   |  - check_role_slot_capacity()                 |
                   |  - check_withdrawal_cooldown()                |
                   |  - protect_canonical_super_admin()            |
                   |  - handle_application_notification()          |
                   +-----------------------------------------------+
```

### Application State Transition Machine

```
              +-------------------+
              |  Student Applies  |
              +-------------------+
                        |
                        v
                 [ status: pending ]
                   /       |       \
     Student Withdrew     Owner     Owner
     (Cooldown Starts)   Accepts   Rejects
          /                |            \
         v                 v             v
  [ withdrawn ]     [ accepted ]    [ rejected ]
                           |
                     Owner Removes
                     (Slot Reopens,
                      No Cooldown)
                           |
                           v
                      [ removed ]
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions, Turbopack) |
| **Frontend Runtime** | React 19, TypeScript 5 |
| **Styling & Icons** | Tailwind CSS v4, Lucide React, Heroicons |
| **Backend & Database** | Supabase (PostgreSQL 15+, Supabase Auth, Realtime) |
| **Security & Auth** | PostgreSQL Row-Level Security (RLS), Bcrypt, SSR Cookie Session Management |
| **Machine Learning** | Scikit-learn, NumPy (offline training) + Native TypeScript (runtime inference) |
| **Hosting & CI/CD** | Vercel (Edge / Serverless Functions), GitHub Actions |

---

## Project Structure

```
DevPair/
├── ml/                                 # Offline Machine Learning Pipeline
│   ├── generate_training_data.py       # Synthetic dataset generation
│   ├── train_model.py                  # Scikit-learn Logistic Regression training
│   └── evaluate_model.py               # Evaluation metrics & confusion matrix
├── public/                             # Static brand assets, logos & icons
│   ├── devpair-logo.png                # Main brand logo
│   ├── devpair-admin-logo.png          # Admin portal branding
│   └── devpair-super-admin-logo.png    # Super Admin identity
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Login, register, auth callback routes
│   │   ├── admin/                      # Administrative portal
│   │   │   ├── admins/                 # Administrator provisioning & demotion
│   │   │   ├── applications/           # Platform-wide join request overview
│   │   │   ├── audit-logs/             # Security & lifecycle audit logging
│   │   │   ├── complaints/             # User dispute & moderation queue
│   │   │   ├── projects/               # Project moderation & role audits
│   │   │   ├── revocation-requests/    # Ban & cooldown appeal review queue
│   │   │   └── users/                  # Student directory & moderation actions
│   │   ├── applications/               # Student application tracker & cooldown UI
│   │   ├── banned/                     # Restricted student landing & ban appeals
│   │   ├── discover/                   # Project discovery & matching interface
│   │   ├── notifications/              # In-app notifications center
│   │   ├── profile/                    # Student profile editor & skill showcase
│   │   └── projects/                   # Project creation, roles & team dashboards
│   ├── components/                     # Global shared UI components
│   │   ├── common/                     # Header, Footer, ThemeToggle, SignOut
│   │   └── ui/                         # Base design system primitives
│   ├── features/                       # Domain-driven feature modules
│   │   ├── admin/                      # Admin actions, queries, metrics
│   │   ├── applications/               # Join requests, cooldowns, slot capacity
│   │   ├── complaints/                 # Reporting & moderation actions
│   │   ├── matching/                   # TypeScript ML scoring & inference engine
│   │   ├── moderation/                 # Ban & cooldown revocation server actions
│   │   ├── notifications/              # Notification dispatcher & realtime hooks
│   │   └── projects/                   # Project management & role slot controls
│   ├── lib/                            # Shared utilities
│   │   ├── auth/                       # Role checks (requireAdmin, requireSuperAdmin)
│   │   └── supabase/                   # Supabase client factories (browser, server, admin)
│   └── types/                          # Core TypeScript definitions & database schemas
└── supabase/
    └── migrations/                     # Versioned PostgreSQL migration scripts
```

---

## Database Schema & Migrations

The database is built on PostgreSQL with strict constraints, relational foreign keys, and trigger-based authorization:

1. `public.profiles`: Student profiles, university information, graduation year, bio, and social links.
2. `public.skills` & `public.profile_skills`: Normalized skill registry with student proficiency levels.
3. `public.projects` & `public.project_roles`: Project entities and role openings with specific skill requirements.
4. `public.applications`: Join requests tracking `pending`, `accepted`, `rejected`, `withdrawn`, and `removed` statuses.
5. `public.withdrawal_cooldowns`: Records student withdrawal cooldowns with `cooldown_until` timestamps and admin revocation fields.
6. `public.restriction_revoke_requests`: Formal student appeal records for active bans and withdrawal cooldowns.
7. `public.audit_logs`: Immutable audit trail capturing 10 distinct security and lifecycle event types.
8. `public.admin_users`: Segregated administrator registry tracking roles (`admin`, `super_admin`) and active statuses.
9. `public.user_bans`: Moderation table containing active user suspensions and administrative reasons.
10. `public.complaints`: Student-submitted incident reports regarding users or projects.
11. `public.notifications`: System and lifecycle notifications delivered in real time via Supabase Realtime.

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Hosted Supabase Project** (or local Supabase CLI)

### 1. Clone the Repository
```bash
git clone https://github.com/hemant-raghav-kr/DevPair.git
cd DevPair
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Populate the required environment keys:
```env
# Hosted Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!WARNING]
> Never commit `.env.local` or expose your `SUPABASE_SERVICE_ROLE_KEY` to client-side bundles.

### 4. Push Database Migrations
Apply all versioned database migrations to your Supabase project:

```bash
npx supabase db push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the DevPair application.

---

## Verification & Quality Assurance

DevPair maintains zero-tolerance for type inaccuracies, lint warnings, or broken builds:

```bash
# TypeScript strict type checking
npm run type-check

# Next.js & React 19 lint rules
npm run lint

# Production Turbopack compilation
npm run build
```

---

## Security & Authorization Model

- **Zero Client-Side Trust**: Client parameters are never trusted for authorization. All admin and member operations enforce server-side authentication (`requireAdmin()`, `requireSuperAdmin()`, or matching user IDs) before executing queries.
- **Row-Level Security (RLS)**: Public tables enforce strict RLS policies. Normal students cannot read administrative tables, other users' private settings, or unauthorized join requests.
- **Database Trigger Isolation**: Critical business logic—such as role slot capacity limits, withdrawal cooldown enforcement, and canonical super admin protection—runs inside PostgreSQL triggers (`SECURITY DEFINER`), guaranteeing protection against direct SDK or REST tampering.
- **Permanent Super Admin Immutability**: The canonical Super Admin account is permanently guarded by database triggers preventing deletion, deactivation, or demotion under any circumstance.

---

## Production Deployment

DevPair is optimized for deployment on **Vercel** paired with **Supabase**:

1. **Deploy to Vercel**: Connect your GitHub repository to Vercel.
2. **Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` (`https://<your-app>.vercel.app`) in the Vercel Project Settings.
3. **Build Command**: `next build` (using Turbopack).
4. **Output Directory**: `.next`.

---

## License & Attribution

Designed and developed by the **DevPair Team**. Built for student developers, hackathon innovators, and university collaborative ecosystems.
