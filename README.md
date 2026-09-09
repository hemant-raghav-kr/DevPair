# DevPair

DevPair is a collaborative platform designed for college students to find teammates for academic projects, hackathons, and open-source initiatives based on complementary skills, shared interests, availability, and project requirements.

"Find the right people to build with."

---

## Core Product Capabilities

- **Project Discovery (`/discover`)**: Browse, search, and filter public recruiting student projects by title, description, role titles, and required tech skills.
- **Skill-Based AI Matching Engine**: Intelligent compatibility prediction powered by a trained **Logistic Regression** model predicting student-to-role suitability ($P \in [0.0, 1.0]$, score $0–100\%$).
- **Explainable Matching Factors**: Transparent breakdowns displaying key strengths (`✓`) and growth areas (`△`) based on feature contributions.
- **Project Roles & Slot Capacity**: Project creators define specific technical roles with required skills and slot capacity, protected by atomic database triggers.
- **Applications & Join Requests**: Interactive join request workflows with applicant dashboards (`/applications`) and owner review panels (`/projects/[id]/applications`).
- **Realtime Notifications**: Instant in-app alerts and notifications center (`/notifications`) with live unread badge counters.
- **Public Student Profiles (`/profile/[username]`)**: Case-insensitive portfolio showcase highlighting verified technical skills and availability without exposing private auth data.
- **Secure Admin Portal (`/admin`)**: Privileged operational dashboard for platform health metrics, student management, project moderation, and join request activity.


## Machine Learning Subsystem (`ml/`)

DevPair uses a dedicated machine learning pipeline for matchmaking:
- **Model**: `LogisticRegression(C=1.0, solver='lbfgs', random_state=42)` trained with `scikit-learn` in Python.
- **Features**: 8 bounded continuous features derived strictly from relational database entities (required skill match & proficiency, category overlap, project alignment, availability fit, toolkit breadth, and experience depth).
- **Deployment**: Serialized parameters (`weights`, `intercept`) execute natively in TypeScript within Next.js Server Components. **Zero Python server required at runtime** for 100% Vercel serverless compatibility.
- **Evaluation**: 97.60% Accuracy, 96.69% Precision, 98.32% Recall, 0.9966 ROC-AUC on held-out test data ($N = 500$).

> [!NOTE]
> **ML Disclosure**: The matching engine is currently a mathematically grounded proof-of-concept bootstrapped on synthetic data. As live student applications accumulate (`status = 'accepted' | 'rejected'`), the pipeline is designed to be continuously retrained on real user interaction outcomes. See [`ml/README.md`](ml/README.md) for technical details.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Backend & Auth**: Hosted Supabase (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL with RLS)
- **Machine Learning**: Python 3, `scikit-learn`, `numpy` (offline training) + TypeScript (online inference)
- **Deployment Target**: Vercel

---

## Local Development Prerequisites

- **Node.js**: v20.x or higher
- **Python**: v3.10+ (for running ML training pipeline in `ml/`)
- **Package Manager**: `npm`
- **Hosted Supabase Project**: Configured with DevPair migrations and RLS policies

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL (`https://<ref>.supabase.co`) | Public (Browser & Server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable / Anonymous Key | Public (Browser & Server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret Key (never expose to client code) | Private (Server-only / scripts) |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g., `http://localhost:3000`) | Public (Browser & Server) |

---

## Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Quality & Build Verification
```bash
npm run type-check
npm run lint
npm run build
```

### 4. Machine Learning Pipeline (Optional)
```bash
python ml/generate_training_data.py
python ml/train_model.py
python ml/evaluate_model.py
```

---

## Administration & Security Model (`/admin`)

DevPair implements a segregated, zero-trust administration system:

### 1. Authorization Architecture
- **Dedicated Admin Registry (`public.admin_users`)**: User administrator membership is stored in `public.admin_users(user_id, created_at, is_active, created_by)`. Ordinary students have no `is_admin` boolean in their client-editable `profiles` table.
- **Non-Recursive RLS Enforcement**: Row-level security on `public.admin_users` permits reads only to verified administrators via a `SECURITY DEFINER` function (`is_admin()`). All `INSERT`, `UPDATE`, and `DELETE` operations are strictly blocked for public and authenticated client roles.
- **Server-Side Authorization Boundary (`requireAdmin()`)**: Every admin page and server query executes `requireAdmin()`. Client parameters, cookies, or headers are never trusted. Unauthenticated requests are redirected to `/login`, and regular student accounts receive an unauthorized redirect.
- **Server-Only Service-Role Operations**: Privileged cross-user aggregation queries are executed via server-only modules (`createAdminClient()`) strictly behind `requireAdmin()`, ensuring secrets never leak to client bundles.

### 2. Admin Account Provisioning
Administrators are provisioned through secure server-side scripting:
1. Specify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` (kept strictly gitignored).
2. Provisioning registers the user in Supabase Auth and registers their UUID in `public.admin_users` with `is_active = true`.
3. Account credentials are never logged, printed, or checked into version control.

### 3. Admin Dashboard Capabilities
- **Platform Overview (`/admin`)**: Real-time database KPI cards (total students, weekly growth, active projects, hackathon initiatives, join request acceptance rates), pipeline funnel visualization, and domain distribution.
- **Student Directory (`/admin/users`)**: Searchable student profiles displaying college, degree, graduation year, skill count, owned projects count, and join requests.
- **Project Directory (`/admin/projects`)**: Filterable project moderation table with status, hackathon flag, visibility, owner details, and role slot capacities.
- **Application Activity (`/admin/applications`)**: Platform-wide join request activity tracking with status filters and applicant-to-project mappings.

