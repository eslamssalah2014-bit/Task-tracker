# Task Tracker

> A production-ready, modern, and intelligent operational project and task management system designed specifically for internal team execution, accountability, and managerial visibility.

---

## 🌟 Executive Overview

**Task Tracker** is not a simple to-do list. It is an intelligent operational control platform engineered to give managers complete visibility over active tasks, pending approvals, deadlines, blocked work items, and team workload capacity.

Built around the core operational principle:
> **"The manager should never need to manually inspect every task to understand what is happening. The system automatically surfaces problems, delays, risks, blockers, missing updates, upcoming deadlines, approvals, and workload issues."**

---

## 🏗️ Architecture & Tech Stack

```
Frontend (Next.js 14 App Router on Vercel)
       │
       ▼  REST API (/api/v1/)
Backend (Node.js & Express.js on Render)
       │
       ├──► Supabase PostgreSQL (Database & RLS)
       ├──► Supabase Storage (File Attachments)
       └──► Background Workers (Daily SLA, Deadline & Risk Scanners)
```

- **Frontend**: Next.js 14 (React 18), TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js, TypeScript, Zod Schema Validation, Helmet, Rate Limiting
- **Database**: PostgreSQL (Supabase schema migrations with foreign keys, indexes, and RLS)
- **Authentication**: Role-Based Access Control (Super Admin, Manager, Team Member) with persistent session tokens
- **Timezone**: Default configured to `Africa/Cairo` (UTC+2/UTC+3)

---

## 🚀 Key Modules & Capabilities

1. **Executive Dashboard**:
   - Top KPI drill-down cards: Total, In Progress, Blocked, Overdue, Due Today, Due This Week, Tasks Without Recent Updates, Waiting for Approval.
   - Real-time visual charts: Status donut chart, Priority distribution, Team breakdown, and 4-week creation vs completion trend lines.
2. **Manager Command Center**:
   - Prioritizes problems over passive lists: "Needs Your Attention" section highlighting overdue milestones, blocked tasks, deliverable reviews, and stalled updates (>3 days).
   - Automated rule-based operational insights.
   - Team Workload Analysis with capacity categories: *Low*, *Normal*, *High*, and *Overloaded*.
3. **Core Tasks Management**:
   - Multi-view experience: **Table View**, **Kanban Board** (drag/drop between statuses), and **Calendar View**.
   - Subtasks with automated parent progress calculation.
   - Interactive Checklists.
   - Task Updates with progress %, next steps, and blocker logging.
   - Blocked Task System with 8 root cause categories and blocker duration tracking.
   - Predecessor Task Dependencies with **Circular Dependency Prevention**.
   - Side Drawer for rapid task review without navigating away from the current board.
4. **Completion Approval Workflow**:
   - Optional `requires_approval` flag on critical tasks.
   - Team members submit deliverables for review; Managers approve (finalizes as Completed) or request changes with rejection notes.
5. **Smart Task Health & Scoring Engine**:
   - Continuous score evaluation (0–100) and health indicators (*Healthy*, *At Risk*, *Critical*, *Blocked*, *Completed*).
   - Flags tasks where elapsed time exceeds progress (e.g. 80% time elapsed with 20% progress).
6. **User & Team Management**:
   - Role-based permissions matrix for Super Admins, Managers, and Team Members.
   - Active and completed task count aggregations per user and team.
7. **Reports & Exports**:
   - Task Aging breakdown (0–3d, 4–7d, 8–14d, 15–30d, 30+d).
   - On-time vs late delivery rate analytics.
   - One-click CSV export and print-optimized PDF view.
8. **Background Scheduled Scanning**:
   - Daily automated health scanner (`DailyTaskCheckJob`) identifying upcoming deadlines, overdue tasks, and reminders.
9. **Extensible AI & Integration Architecture**:
   - Modular `AIService` abstraction for future Gemini, OpenAI, or Claude integration.
   - Outgoing Webhook dispatcher and modular Email provider integration (Resend, SendGrid, Brevo).

---

## 📁 Repository Structure

```
task-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Zod environment validation & Supabase config
│   │   ├── controllers/     # Task, User, Team, Dashboard, Report, Settings controllers
│   │   ├── jobs/            # Daily task check and deadline scanner
│   │   ├── middleware/      # Auth (RBAC), request validator, global error handler
│   │   ├── repositories/    # Data access layer for tasks, users, teams, system
│   │   ├── routes/          # REST API routes mounted under /api/v1/
│   │   ├── services/        # Task health scoring, notifications, AI & email services
│   │   ├── tests/           # Jest + Supertest automated API test suite
│   │   ├── types/           # TypeScript domain definitions
│   │   ├── utils/           # Date calculations, logger, standardized responses
│   │   ├── app.ts           # Express setup with Helmet & CORS
│   │   └── server.ts        # Server entry point with graceful shutdown
│   ├── database/
│   │   ├── migrations/      # 001_initial_schema.sql (PostgreSQL / Supabase)
│   │   └── seeds/           # seed.sql (Realistic seed data)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/        # Login page with 1-click role switcher
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx         # Executive Dashboard
│   │   │   │   ├── manager/         # Manager Command Center & Insights
│   │   │   │   ├── my-tasks/        # Personal workspace
│   │   │   │   ├── tasks/           # Table, Kanban, and Calendar views
│   │   │   │   │   └── [id]/        # Full Task Details page
│   │   │   │   ├── users/           # User Management module
│   │   │   │   ├── teams/           # Team Management module
│   │   │   │   ├── reports/         # Reports & CSV/PDF exports
│   │   │   │   ├── templates/       # Task Templates
│   │   │   │   ├── settings/        # Admin Settings & Audit Trail
│   │   │   │   └── profile/         # User Profile & Notification preferences
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── layout/              # Sidebar, TopNavbar, GlobalSearch, NotificationDrawer
│   │   │   ├── tasks/               # CreateTaskModal, QuickUpdateModal, BlockerModal, TaskDetailDrawer
│   │   │   └── ui/                  # Badge, Modal, Drawer
│   │   ├── context/                 # AuthContext
│   │   ├── lib/                     # REST API client
│   │   └── types/                   # Frontend domain types
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── package.json
└── README.md
```

---

## ⚙️ Quick Start & Local Setup

### Prerequisites
- Node.js >= 18.x (tested on v24)
- npm >= 9.x

### 1. Clone & Install Dependencies
```bash
cd task-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

DEFAULT_TIMEZONE=Africa/Cairo
DEFAULT_NO_UPDATE_THRESHOLD_DAYS=3

EMAIL_PROVIDER=mock
EMAIL_FROM=notifications@tasktracker.io
AI_PROVIDER=mock
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Backend Automated Tests
```bash
cd backend
npm test
```
All 8 integration test suites will execute and pass, verifying health checks, authentication, task creation validation, circular dependency prevention, and task health evaluation.

### 4. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend REST API):**
```bash
cd backend
npm run dev
# API running at http://localhost:5000
# Health check: http://localhost:5000/health
# API v1: http://localhost:5000/api/v1
```

**Terminal 2 (Next.js Frontend):**
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:3000
```

Visit **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Credentials & Instant Role Switcher

For quick evaluation without manual setup, the application includes a **1-Click Role Switcher** in both the Login page and the Top Navbar:

| Role | Demo User | Email | Password |
|---|---|---|---|
| **Super Admin** | Eslam Salah | `eslam@tasktracker.io` | `Admin@123` |
| **Manager** | Walied Said | `walied@tasktracker.io` | `Admin@123` |
| **Team Member** | Sarah Ahmed | `sarah@tasktracker.io` | `Admin@123` |

---

## 🗄️ Database Setup (Supabase)

To connect to your live Supabase project:
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the migration script in:
   `backend/database/migrations/001_initial_schema.sql`
3. Run the seed script in:
   `backend/database/seeds/seed.sql`
4. Copy your project **URL**, **anon key**, and **service-role key** into `backend/.env` and `frontend/.env.local`.

---

## 🚀 Deployment

### Deploying Frontend to Vercel
1. Push this repository to GitHub or GitLab.
2. Import the `frontend` folder as a project in Vercel.
3. Set the Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g. `https://task-tracker-api.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
4. Deploy!

### Deploying Backend to Render
1. Create a new **Web Service** on Render pointing to the `backend` folder.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Set Health Check Path: `/health`
5. Configure Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, etc.).
6. To schedule the daily task check, create a **Render Cron Job** hitting `POST /api/v1/jobs/daily-check` once daily.

---

## 🛡️ Security & Hardening Notes
- **Row Level Security & Backend Isolation**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. All sensitive mutations route through the Express API.
- **Input Sanitization & Schema Validation**: Handled by Zod schemas on every endpoint.
- **Security Headers & Rate Limiting**: Enforced via Helmet and Express Rate Limit.
- **Immutable Audit Trail**: All task status changes, deadline modifications, and blocker logs are recorded with user attribution.
