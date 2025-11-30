# ERP System - Implementation Summary

## Overview

A full-stack ERP system built with FastAPI (Python) and Next.js 14 (TypeScript), deployed on Google Cloud Run with Cloud SQL PostgreSQL.

## Current Status (November 2024)

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | ✅ Complete | JWT access/refresh tokens |
| **User Management** | ✅ Complete | Admin CRUD, activate/deactivate |
| **Role-Based Access** | ✅ Complete | admin/manager/staff/viewer roles |
| **Role-Based UI** | ✅ Complete | Hide/show buttons per role |
| **Customers Module** | ✅ Complete | Full CRUD |
| **Products Module** | ✅ Complete | Full CRUD |
| **Orders Module** | ✅ Complete | **Multiple line items** |
| **Invoices Module** | ✅ Complete | **Multiple line items**, order linking |
| **Payments Module** | ✅ Complete | Invoice application |
| **Dashboard** | ✅ Complete | Analytics, metrics, recent activity |
| **Login Page** | ✅ Complete | Beautiful branded UI |
| **Route Protection** | ✅ Complete | Auth guard on dashboard |

### ⏳ Pending Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Rate limiting | High | Removed due to deployment issues (needs Redis) |
| Password reset | Medium | Users can't reset passwords |
| Audit logging | Medium | Track who changed what |
| Automated tests | High | No tests exist currently |
| CI/CD pipeline | High | Manual deployment only |
| Salesforce integration | Medium | Webhook endpoints needed |

## Project Structure

```
erp-frontend/
├── backend/                     # FastAPI with JWT auth
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py          # Login, refresh (register disabled)
│   │   │   ├── users.py         # Admin user management
│   │   │   ├── customers.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── invoices.py
│   │   │   └── payments.py
│   │   ├── core/
│   │   │   ├── auth.py          # JWT token handling
│   │   │   ├── config.py        # Settings
│   │   │   └── security.py      # Role checking
│   │   ├── models/              # SQLAlchemy models
│   │   └── schemas/             # Pydantic schemas
│   ├── alembic/                 # Migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── env.example
│
├── frontend/                    # Next.js 14 frontend
│   ├── app/
│   │   ├── login/page.tsx       # Login page
│   │   └── dashboard/
│   │       ├── layout.tsx       # Auth guard
│   │       ├── page.tsx         # Dashboard with analytics
│   │       ├── admin/users/     # User management
│   │       ├── customers/
│   │       ├── products/
│   │       ├── orders/
│   │       ├── invoices/
│   │       └── payments/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── customers/
│   │   ├── products/
│   │   ├── orders/              # OrderDialog with multiple lines
│   │   ├── invoices/            # InvoiceDialog with multiple lines
│   │   ├── payments/
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── api/                 # API client functions
│   │   ├── types/               # TypeScript interfaces
│   │   ├── auth.ts              # Token storage
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-permissions.ts   # Role-based UI permissions
│   │   └── use-toast.ts
│   ├── next.config.js           # Production API URL configured here
│   └── env.example
│
├── README.md                    # Main documentation
├── CLAUDE.md                    # AI assistant guide
├── PRODUCTION_PLAN.md           # Deployment roadmap
└── IMPLEMENTATION_SUMMARY.md    # This file
```

## Technical Stack

### Backend
- **Framework:** FastAPI 0.110
- **Language:** Python 3.11
- **ORM:** SQLAlchemy 2.0 (async)
- **Database:** PostgreSQL 16
- **Auth:** python-jose (JWT), passlib (bcrypt)
- **Migrations:** Alembic

### Frontend
- **Framework:** Next.js 14.1.3 (App Router)
- **Language:** TypeScript 5
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **State Management:** TanStack Query 5.28
- **Forms:** React Hook Form 7.51 + Zod 3.22
- **HTTP Client:** Axios 1.6

### Deployment
- **Platform:** Google Cloud Run
- **Database:** Cloud SQL (PostgreSQL)
- **Region:** us-central1

## Key Implementation Details

### Multiple Line Items (Orders & Invoices)
- Used `useFieldArray` from react-hook-form
- Dynamic add/remove with validation
- Auto-populate price from product selection
- Live subtotal calculation

### Role-Based UI Permissions
- `usePermissions` hook in `hooks/use-permissions.ts`
- Roles: admin, manager, staff, viewer
- Permissions: canCreate, canEdit, canDelete, canManageUsers
- Applied to all data tables

### Dashboard Analytics
- Stat cards with icons (lucide-react)
- Orders/Invoices by status breakdown
- Recent orders and payments lists
- Outstanding invoices metric

### Environment Variables (Important!)
- Next.js `NEXT_PUBLIC_*` vars are baked at **build time**
- Production API URL is in `next.config.js` as fallback
- Cloud Run env vars don't work for Next.js public vars

## API Endpoints

### Authentication (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login, get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |

> Note: `/auth/register` is disabled for security

### Authenticated Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/me` | Get current user |
| GET/POST | `/api/v1/customers` | List/Create |
| GET/PUT | `/api/v1/customers/{id}` | Read/Update |
| GET/POST | `/api/v1/products` | List/Create |
| GET/PUT | `/api/v1/products/{id}` | Read/Update |
| GET/POST | `/api/v1/orders` | List/Create (with lines) |
| GET/PUT/DELETE | `/api/v1/orders/{id}` | Read/Update/Delete |
| GET/POST | `/api/v1/invoices` | List/Create (with lines) |
| GET/PUT | `/api/v1/invoices/{id}` | Read/Update |
| GET/POST | `/api/v1/payments` | List/Create |
| GET/PUT/DELETE | `/api/v1/payments/{id}` | Read/Update/Delete |

### Admin Only Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create user |
| PUT | `/api/v1/users/{id}` | Update user |

### Health Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/healthz` | Health check |

## Security Measures

### ✅ Implemented
- JWT tokens with expiration (access: 60min, refresh: 7 days)
- Refresh token rotation
- Password hashing (bcrypt)
- Role-based endpoint protection
- Environment-based CORS configuration
- Public registration disabled

### ⚠️ Needs Work
- Rate limiting (removed, needs Redis)
- Request logging/audit trail
- Account lockout after failed attempts

## Deployment Notes

### Critical: Next.js Environment Variables
Next.js `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime. Setting them in Cloud Run doesn't work. The solution is to hardcode the production URL in `next.config.js`:

```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1'
```

### Cloud Run URLs
There are two URL formats:
- Project-based: `https://SERVICE-PROJECT_NUMBER.REGION.run.app`
- Service-based: `https://SERVICE-HASH.a.run.app`

Both work, but be consistent. Check actual URL with:
```bash
gcloud run services describe SERVICE_NAME --region=REGION --format="get(status.url)"
```

---

*Last Updated: November 30, 2024*
