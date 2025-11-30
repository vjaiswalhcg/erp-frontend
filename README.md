# ERP System - CRM View

A modern, full-stack ERP system built for Salesforce integration pilots.

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Frontend     │────▶│     Backend      │────▶│    Database      │
│   Next.js 14     │     │    FastAPI       │     │   PostgreSQL     │
│   Cloud Run      │     │    Cloud Run     │     │   Cloud SQL      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## ✅ Implemented Features

| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ | JWT access/refresh tokens, role-based access |
| **User Management** | ✅ | Admin CRUD, roles (admin/manager/staff/viewer) |
| **Customers** | ✅ | Full CRUD operations |
| **Products** | ✅ | Full CRUD operations |
| **Orders** | ✅ | Single line item per order |
| **Invoices** | ✅ | Single line item, optional order linking |
| **Payments** | ✅ | Optional invoice application |
| **Dashboard** | ✅ | Counts and revenue totals |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or Docker)
- Git

### Local Development

**1. Clone the repository:**
```bash
git clone https://github.com/vjaiswalhcg/erp-frontend.git
cd erp-frontend
```

**2. Backend Setup:**
```bash
cd frontend/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

**3. Frontend Setup:**
```bash
cd frontend/frontend

# Install dependencies
npm install

# Copy and configure environment
cp env.example .env.local
# Edit .env.local - set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

**4. Open browser:** http://localhost:3000

## 📁 Project Structure

```
EDW/
├── frontend/
│   ├── backend/              # FastAPI backend (JWT auth + User management)
│   │   ├── app/
│   │   │   ├── api/v1/       # API endpoints
│   │   │   ├── core/         # Config, auth, security
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   └── schemas/      # Pydantic schemas
│   │   ├── alembic/          # Database migrations
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── frontend/             # Next.js 14 frontend
│       ├── app/              # App router pages
│       ├── components/       # React components
│       ├── lib/              # API clients & utilities
│       └── hooks/            # Custom React hooks
│
├── backend/                  # ⚠️ OLD - Simple auth (deprecated)
├── CLAUDE.md                 # AI assistant guide
├── IMPLEMENTATION_SUMMARY.md # Feature details
└── README.md                 # This file
```

> **Note:** The `backend/` folder at root level contains an older version with simple bearer token auth. The current deployed version is in `frontend/backend/` with full JWT authentication.

## 🌐 Deployment

### Deployed URLs

- **Frontend:** https://erp-frontend-377784510062.us-central1.run.app
- **Backend:** https://erp-backend-377784510062.us-central1.run.app/docs

### Deploy to Google Cloud Run

**Backend:**
```bash
cd frontend/backend

gcloud run deploy erp-backend \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=PROJECT:REGION:INSTANCE \
  --set-env-vars="DATABASE_URL=...,SECRET_KEY=...,CORS_ORIGINS=https://your-frontend.run.app"
```

**Frontend:**
```bash
cd frontend/frontend

gcloud run deploy erp-frontend \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://your-backend.run.app/api/v1"
```

## 🔐 Environment Variables

### Backend (`frontend/backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg_async://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key | Random 32+ character string |
| `CORS_ORIGINS` | Allowed frontend URLs | `http://localhost:3000,https://frontend.run.app` |

### Frontend (`frontend/frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** TanStack Query (React Query v5)
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.11
- **ORM:** SQLAlchemy (async)
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **Migrations:** Alembic

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Users (Admin only)
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user

### Resources (Authenticated)
- `GET/POST /api/v1/customers` - List/Create customers
- `GET/PUT/DELETE /api/v1/customers/{id}` - CRUD operations
- Same pattern for: `products`, `orders`, `invoices`, `payments`

### Health
- `GET /healthz` - Health check (no auth)

## 🔒 User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access, user management |
| `manager` | CRUD on all modules |
| `staff` | CRUD on own data |
| `viewer` | Read-only access |

## 🚧 Roadmap

### Phase 1: Production Hardening (Current)
- [x] Fix CORS security
- [x] Environment-based configuration
- [x] Documentation cleanup
- [ ] Disable public registration
- [ ] Add rate limiting

### Phase 2: Feature Completion
- [ ] Multiple line items per order/invoice
- [ ] Password reset flow
- [ ] Dashboard charts/analytics
- [ ] Audit logging

### Phase 3: Quality & DevOps
- [ ] Unit tests (pytest, jest)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error boundaries

## 📚 Additional Documentation

- **[CLAUDE.md](CLAUDE.md)** - AI assistant guide & code patterns
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Feature implementation details
- **[STANDARD_WORKFLOW.md](STANDARD_WORKFLOW.md)** - Development workflow

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes locally
3. Test thoroughly
4. Commit with descriptive message
5. Push and create PR

## 📝 License

Private - CRM View

---

*Last Updated: November 2024*
