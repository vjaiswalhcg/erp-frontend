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
| **Orders** | ✅ | **Multiple line items**, status workflow |
| **Invoices** | ✅ | **Multiple line items**, optional order linking |
| **Payments** | ✅ | Optional invoice application |
| **Dashboard** | ✅ | Analytics, metrics, recent activity |
| **Role-Based UI** | ✅ | Hide/show buttons based on user role |

## 🌐 Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://erp-frontend-377784510062.us-central1.run.app |
| Backend API | https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1 |
| API Docs | https://erp-backend-fb7fdd6n4a-uc.a.run.app/docs |

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
cd backend

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
cd frontend

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
erp-frontend/
├── backend/                  # FastAPI backend (JWT auth + User management)
│   ├── app/
│   │   ├── api/v1/           # API endpoints
│   │   ├── core/             # Config, auth, security
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # Next.js 14 frontend
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # API clients & utilities
│   └── hooks/                # Custom React hooks (useAuth, usePermissions)
│
├── CLAUDE.md                 # AI assistant guide
├── PRODUCTION_PLAN.md        # Deployment roadmap
├── IMPLEMENTATION_SUMMARY.md # Feature details
└── README.md                 # This file
```

## 🚀 Deployment

### Deploy Backend
```bash
cd ~/erp-monorepo/backend
git pull origin main

gcloud run deploy erp-backend --source . --region us-central1 \
  --update-env-vars="CORS_ORIGINS=https://erp-frontend-377784510062.us-central1.run.app"
```

### Deploy Frontend
```bash
cd ~/erp-monorepo/frontend
git pull origin main

gcloud run deploy erp-frontend --source . --region us-central1 \
  --platform managed --allow-unauthenticated
```

> **Important:** The frontend API URL is configured in `next.config.js` (not Cloud Run env vars) because Next.js bakes `NEXT_PUBLIC_*` variables at build time.

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg_async://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key | Random 32+ character string |
| `CORS_ORIGINS` | Allowed frontend URLs | `https://frontend.run.app` |

### Frontend (`frontend/next.config.js`)

The production API URL is configured in `next.config.js`:
```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1'
```

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
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

> Note: Public registration is disabled for security. Users are created by admins via `/api/v1/users/`.

### Users (Admin only)
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user

### Resources (Authenticated)
- `GET/POST /api/v1/customers` - List/Create customers
- `GET/PUT /api/v1/customers/{id}` - Read/Update customer
- Same pattern for: `products`, `orders`, `invoices`, `payments`

### Health
- `GET /` - Service info
- `GET /healthz` - Health check

## 🔒 User Roles & Permissions

| Role | Create | Edit | Delete | Manage Users |
|------|--------|------|--------|--------------|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ❌ |
| `staff` | ✅ | ✅ | ❌ | ❌ |
| `viewer` | ❌ | ❌ | ❌ | ❌ |

## 🚧 Roadmap

See [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) for detailed roadmap.

### Completed ✅
- [x] Security hardening (CORS, env vars, disabled registration)
- [x] Multiple line items for orders/invoices
- [x] Role-based UI permissions
- [x] Dashboard analytics

### Next Up
- [ ] Rate limiting (with Redis)
- [ ] Automated tests
- [ ] CI/CD pipeline
- [ ] Salesforce integration

## 📚 Additional Documentation

- **[CLAUDE.md](CLAUDE.md)** - AI assistant guide & code patterns
- **[PRODUCTION_PLAN.md](PRODUCTION_PLAN.md)** - Deployment roadmap & checklist
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Feature implementation details

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes locally
3. Test thoroughly (`npm run build` for frontend)
4. Commit with descriptive message
5. Push and create PR

## 📝 License

Private - CRM View

---

*Last Updated: November 30, 2024*
