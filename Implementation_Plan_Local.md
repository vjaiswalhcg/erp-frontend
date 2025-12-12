# Local Development Environment Setup - Implementation Plan

## Executive Summary

This document provides a complete step-by-step guide to set up a fully functional local development environment for the ERP system on your MacBook. This will allow you to develop, test, and validate all changes locally before pushing to Git and deploying to Google Cloud.

**Current State:** Development happens locally → Push to Git → Pull in Cloud Shell → Deploy → Test in production

**Target State:** Development happens locally → Test locally → Push to Git → Pull in Cloud Shell → Deploy to production

---

## Table of Contents
1. [Components Analysis](#components-analysis)
2. [Prerequisites Check](#prerequisites-check)
3. [Required Software Installation](#required-software-installation)
4. [Local Database Setup](#local-database-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Testing & Validation](#testing--validation)
8. [Code Changes Required](#code-changes-required)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Development Workflow](#development-workflow)

---

## Components Analysis

### Current Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                    YOUR MACBOOK (LOCAL)                      │
│  - Frontend code (Next.js)                                   │
│  - Backend code (FastAPI)                                    │
│  - Git repository                                            │
│  - NO DATABASE ❌                                            │
│  - NO RUNNING SERVICES ❌                                    │
└──────────────────────────────────────────────────────────────┘
                          ↓ git push
┌──────────────────────────────────────────────────────────────┐
│                   GOOGLE CLOUD SHELL                         │
│  - Git pull                                                  │
│  - Docker build                                              │
│  - Deploy to Cloud Run                                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│               GOOGLE CLOUD RUN (PRODUCTION)                  │
│  - Frontend Service (Next.js container)                      │
│  - Backend Service (FastAPI container)                       │
│  - Cloud SQL (PostgreSQL)                                    │
└──────────────────────────────────────────────────────────────┘
```

### Target Local Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                    YOUR MACBOOK (LOCAL)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend (localhost:3000)                         │     │
│  │  - Next.js Dev Server                              │     │
│  │  - Hot reload enabled                              │     │
│  └────────────────────────────────────────────────────┘     │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Backend (localhost:8000)                          │     │
│  │  - FastAPI with uvicorn                            │     │
│  │  - Auto-reload enabled                             │     │
│  └────────────────────────────────────────────────────┘     │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  PostgreSQL Database (localhost:5432)              │     │
│  │  - Running in Docker container OR                  │     │
│  │  - Installed via Homebrew                          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites Check

### 1. Current System Status
Based on analysis of your MacBook:

| Component | Status | Version | Required |
|-----------|--------|---------|----------|
| Python | ✅ Installed | 3.13.5 | 3.11+ |
| Node.js | ✅ Installed | 24.7.0 | 18+ |
| npm | ✅ Installed | 11.5.1 | 8+ |
| PostgreSQL | ❌ Not Found | - | 14+ |
| Docker | ❌ Not Found | - | Optional |
| Git | ✅ Installed | (assumed) | Any version |

### 2. Project Files Present
- ✅ Backend code: `/Users/vickyjaiswal/Documents/erp-frontend/backend/`
- ✅ Frontend code: `/Users/vickyjaiswal/Documents/erp-frontend/frontend/`
- ✅ Configuration files: `env.example` files present
- ✅ Database migrations: Alembic configured

---

## Required Software Installation

### Option A: PostgreSQL via Homebrew (Recommended for MacBook)

**Advantages:**
- Native performance
- Easier to manage
- Persistent data
- Lower resource usage

**Installation Steps:**

```bash
# 1. Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install PostgreSQL
brew install postgresql@16

# 3. Start PostgreSQL service
brew services start postgresql@16

# 4. Verify installation
psql --version
```

### Option B: PostgreSQL via Docker (Alternative)

**Advantages:**
- Isolated environment
- Easy cleanup
- Matches cloud environment

**Installation Steps:**

```bash
# 1. Install Docker Desktop for Mac
# Download from: https://www.docker.com/products/docker-desktop/

# 2. Start Docker Desktop (from Applications)

# 3. Verify Docker installation
docker --version

# 4. Run PostgreSQL container
docker run --name erp-postgres \
  -e POSTGRES_USER=erp \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=erp_demo \
  -p 5432:5432 \
  -v erp-postgres-data:/var/lib/postgresql/data \
  -d postgres:16
```

---

## Local Database Setup

### Step 1: Create Database (Homebrew Option)

```bash
# Start PostgreSQL if not running
brew services start postgresql@16

# Create database user
createuser -s erp

# Set password for user (in psql shell)
psql postgres
ALTER USER erp WITH PASSWORD 'localdevpassword';
\q

# Create database
createdb -U erp erp_demo

# Verify connection
psql -U erp -d erp_demo -c "SELECT version();"
```

### Step 2: Create Database (Docker Option)

If using Docker, the database is already created. Verify:

```bash
# Check container is running
docker ps | grep erp-postgres

# Test connection
docker exec -it erp-postgres psql -U erp -d erp_demo -c "SELECT version();"
```

### Step 3: Note Your Database Connection String

**For Homebrew:**
```
postgresql+psycopg_async://erp:localdevpassword@localhost:5432/erp_demo
```

**For Docker:**
```
postgresql+psycopg_async://erp:localdevpassword@localhost:5432/erp_demo
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd /Users/vickyjaiswal/Documents/erp-frontend/backend
```

### Step 2: Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

### Step 3: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all backend dependencies
pip install -r requirements.txt
```

**Expected packages:**
- fastapi==0.110.0
- uvicorn[standard]==0.29.0
- sqlalchemy[asyncio]==2.0.25
- psycopg[binary]==3.2.12
- alembic==1.13.1
- pydantic==1.10.14
- passlib[bcrypt]==1.7.4
- python-jose==3.3.0

### Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp env.example .env

# Edit .env file with your local settings
nano .env  # or use your preferred editor
```

**Contents of `.env` for local development:**

```env
# Database Connection
DATABASE_URL=postgresql+psycopg_async://erp:localdevpassword@localhost:5432/erp_demo

# JWT Secret Key (use a strong random string for local dev)
SECRET_KEY=local-dev-secret-key-change-in-production-12345678

# Token Expiration
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Origins (allow local frontend)
CORS_ORIGINS=http://localhost:3000
```

### Step 5: Run Database Migrations

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Run Alembic migrations to create database tables
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxx, create users table
INFO  [alembic.runtime.migration] Running upgrade xxxxx -> yyyyy, create customers table
...
```

### Step 6: Create Initial Admin User (Optional)

You'll need to create an admin user to log in. This can be done via Python script or API after starting the server.

**Option: Create via Python script**

Create a file `create_admin.py` in the backend directory:

```python
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == "admin@example.com"))
        existing = result.scalar_one_or_none()

        if existing:
            print("Admin user already exists")
            return

        # Create admin user
        admin = User(
            email="admin@example.com",
            hashed_password=pwd_context.hash("admin123"),
            full_name="Admin User",
            role="admin",
            is_active=True
        )
        session.add(admin)
        await session.commit()
        print("Admin user created: admin@example.com / admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
```

Run it:
```bash
python create_admin.py
```

### Step 7: Start Backend Server

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Start FastAPI server with auto-reload
uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Will watch for changes in these directories: ['/Users/vickyjaiswal/Documents/erp-frontend/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [yyyyy]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 8: Verify Backend is Running

Open browser and visit:
- http://localhost:8000 - Should show service info
- http://localhost:8000/healthz - Should return `{"status": "ok"}`
- http://localhost:8000/docs - Should show FastAPI Swagger UI

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

**Open a NEW terminal window** (keep backend running in the first one)

```bash
cd /Users/vickyjaiswal/Documents/erp-frontend/frontend
```

### Step 2: Install Node Dependencies

```bash
# Install all frontend dependencies
npm install
```

**Expected packages:**
- next 14.1.3
- react 18.2.0
- typescript 5.x
- @tanstack/react-query 5.28.4
- axios 1.6.7
- shadcn/ui components

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp env.example .env.local

# Edit .env.local file
nano .env.local  # or use your preferred editor
```

**Contents of `.env.local` for local development:**

```env
# Backend API URL - point to local backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Step 4: Start Frontend Development Server

```bash
# Start Next.js development server
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.1.3
  - Local:        http://localhost:3000
  - Ready in 2.5s

 ✓ Compiled in 1234ms
```

### Step 5: Verify Frontend is Running

Open browser and visit:
- http://localhost:3000 - Should show login page

---

## Testing & Validation

### 1. Test Backend API

```bash
# Test health endpoint
curl http://localhost:8000/healthz

# Test login (with admin user created earlier)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@example.com", "password": "admin123"}'

# Should return access_token and refresh_token
```

### 2. Test Frontend Connection

1. Open http://localhost:3000 in browser
2. Try to login with admin credentials
3. Should redirect to dashboard
4. Check browser console for any errors

### 3. Test Database Connection

```bash
# Connect to PostgreSQL
psql -U erp -d erp_demo

# Check tables were created
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

### 4. Test Full Workflow

1. **Create a customer:**
   - Login to frontend
   - Navigate to Customers
   - Click "New Customer"
   - Fill form and save

2. **Verify in database:**
   ```bash
   psql -U erp -d erp_demo -c "SELECT * FROM customers;"
   ```

3. **Check API directly:**
   ```bash
   # Get access token first (from login response)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/customers/
   ```

---

## Code Changes Required

### Analysis: Minimal Changes Needed ✅

Good news! The codebase is already well-configured for local development. Only minor adjustments needed:

### 1. Backend Changes

#### File: `backend/app/core/config.py`

**Current Issue:** Missing CORS_ORIGINS handling

**Required Change:**
```python
from pydantic import BaseSettings, Field
import os


class Settings(BaseSettings):
    app_name: str = "ERP Demo API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field("changeme", description="JWT secret key")
    access_token_header: str = "Authorization"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    database_url: str = Field(
        ...,
        env="DATABASE_URL",
        description="Async SQLAlchemy URL, e.g. postgresql+psycopg_async://user:pass@host:5432/db",
    )
    # ADD THIS LINE:
    cors_origins: str = Field("http://localhost:3000", env="CORS_ORIGINS")

    default_page_size: int = 50
    max_page_size: int = 200

    class Config:
        env_file = ".env"


settings = Settings()
```

**Why:** Currently CORS_ORIGINS is read from `os.getenv()` in `main.py` but not in config settings. This makes it inconsistent.

#### File: `backend/app/main.py`

**Current Code:**
```python
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
```

**Optional Improvement:**
```python
# Use from settings instead
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
```

### 2. Frontend Changes

**No changes required!** ✅

The frontend already properly uses `NEXT_PUBLIC_API_URL` from environment variables and falls back to production URL in `next.config.js`. The `.env.local` file will override this for local development.

### 3. Database Migration Changes

**No changes required!** ✅

Alembic is already configured correctly with `env.py` reading from environment variables.

### 4. Documentation Updates

Should update:
- `README.md` - Enhance local setup instructions (already present but can be improved)
- `CLAUDE.md` - Update workflow to include local testing step

### Summary of Code Changes

| File | Change Type | Priority | Description |
|------|-------------|----------|-------------|
| `backend/app/core/config.py` | Optional | Low | Add cors_origins to Settings class |
| `backend/app/main.py` | Optional | Low | Use settings.cors_origins |
| All other files | None | - | Already configured correctly |

**Verdict:** The codebase is already well-structured for local development. The changes listed above are optional improvements, not requirements.

---

## Troubleshooting Guide

### Issue 1: Backend won't start - "Database connection error"

**Symptom:**
```
sqlalchemy.exc.OperationalError: (psycopg.OperationalError) connection failed
```

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   # Homebrew
   brew services list | grep postgresql

   # Docker
   docker ps | grep postgres
   ```

2. Verify database exists:
   ```bash
   psql -U erp -l
   ```

3. Check `.env` file has correct DATABASE_URL

4. Test connection manually:
   ```bash
   psql postgresql://erp:localdevpassword@localhost:5432/erp_demo
   ```

### Issue 2: Frontend can't connect to backend

**Symptom:** Network errors in browser console

**Solutions:**
1. Verify backend is running: http://localhost:8000/healthz

2. Check `.env.local` has correct API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. Check browser console for CORS errors

4. Verify CORS_ORIGINS in backend `.env` includes `http://localhost:3000`

5. Restart both frontend and backend after env changes

### Issue 3: Alembic migrations fail

**Symptom:**
```
Target database is not up to date.
```

**Solutions:**
1. Check database connection:
   ```bash
   psql -U erp -d erp_demo -c "SELECT 1;"
   ```

2. Check alembic_version table:
   ```bash
   psql -U erp -d erp_demo -c "SELECT * FROM alembic_version;"
   ```

3. Reset migrations (CAUTION - destroys data):
   ```bash
   # Drop all tables
   psql -U erp -d erp_demo -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

   # Re-run migrations
   alembic upgrade head
   ```

### Issue 4: Port already in use

**Symptom:**
```
Error: Address already in use
```

**Solutions:**
1. Find process using port:
   ```bash
   # For port 8000
   lsof -i :8000

   # For port 3000
   lsof -i :3000
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or use different ports:
   ```bash
   # Backend
   uvicorn app.main:app --reload --port 8001

   # Frontend
   npm run dev -- -p 3001
   ```

### Issue 5: Python virtual environment issues

**Symptom:** ImportError or module not found

**Solutions:**
1. Verify virtual environment is activated:
   ```bash
   which python
   # Should show: /Users/vickyjaiswal/Documents/erp-frontend/backend/venv/bin/python
   ```

2. Recreate virtual environment:
   ```bash
   cd backend
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### Issue 6: Node modules issues

**Symptom:** Module not found errors in frontend

**Solutions:**
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue 7: Cannot create admin user

**Symptom:** User model not found or database errors

**Solutions:**
1. Ensure migrations ran successfully:
   ```bash
   alembic current
   alembic upgrade head
   ```

2. Check users table exists:
   ```bash
   psql -U erp -d erp_demo -c "\d users"
   ```

3. Use API to create user (if no authentication required initially)

---

## Development Workflow

### Daily Development Process

**Morning Setup (Starting Work):**

```bash
# Terminal 1: Start Database (if not auto-started)
brew services start postgresql@16
# OR
docker start erp-postgres

# Terminal 2: Start Backend
cd /Users/vickyjaiswal/Documents/erp-frontend/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start Frontend
cd /Users/vickyjaiswal/Documents/erp-frontend/frontend
npm run dev
```

**Making Changes:**

1. **Code Changes:**
   - Edit files in your preferred IDE (VS Code, PyCharm, etc.)
   - Backend auto-reloads on file changes (via `--reload`)
   - Frontend auto-reloads on file changes (built into Next.js)

2. **Database Changes:**
   ```bash
   # Create new migration
   cd backend
   alembic revision --autogenerate -m "description of changes"

   # Apply migration
   alembic upgrade head
   ```

3. **Testing Changes:**
   - Frontend: Check browser at http://localhost:3000
   - Backend API: Check http://localhost:8000/docs
   - Database: Use psql or GUI tool like pgAdmin

**Committing Changes:**

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add vendor management module

- Add Vendor model and API endpoints
- Add VendorTable and VendorDialog components
- Add vendor management page to dashboard"

# Push to GitHub
git push origin main
```

**Deploying to Production:**

```bash
# SSH into Google Cloud Shell
gcloud cloud-shell ssh

# Pull latest changes
cd ~/erp-monorepo
git pull origin main

# Deploy backend
cd backend
gcloud run deploy erp-backend --source . --region us-central1

# Deploy frontend
cd ../frontend
gcloud run deploy erp-frontend --source . --region us-central1
```

### New Feature Development Process

**Example: Adding "Vendors" Module**

1. **Backend (Terminal 2):**
   ```bash
   cd backend

   # Create model
   touch app/models/vendor.py

   # Create schema
   touch app/schemas/vendor.py

   # Create endpoint
   touch app/api/v1/endpoints/vendors.py

   # Generate migration
   alembic revision --autogenerate -m "add vendors table"
   alembic upgrade head
   ```

2. **Frontend (Terminal 3):**
   ```bash
   cd frontend

   # Create types
   touch lib/types/vendor.ts

   # Create API client
   touch lib/api/vendors.ts

   # Create components
   mkdir components/vendors
   touch components/vendors/VendorTable.tsx
   touch components/vendors/VendorDialog.tsx

   # Create page
   mkdir -p app/dashboard/vendors
   touch app/dashboard/vendors/page.tsx
   ```

3. **Test locally** at http://localhost:3000

4. **Commit and push** to GitHub

5. **Deploy to production** via Cloud Shell

### Ending Day (Shutting Down)

```bash
# Stop frontend (Ctrl+C in Terminal 3)

# Stop backend (Ctrl+C in Terminal 2)

# Stop database (optional, or leave running)
brew services stop postgresql@16
# OR
docker stop erp-postgres
```

---

## Quick Reference

### Service URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | http://localhost:3000 | https://erp-frontend-377784510062.us-central1.run.app |
| Backend API | http://localhost:8000 | https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1 |
| API Docs | http://localhost:8000/docs | https://erp-backend-fb7fdd6n4a-uc.a.run.app/docs |
| Database | localhost:5432 | Cloud SQL |

### Common Commands

```bash
# Backend
cd /Users/vickyjaiswal/Documents/erp-frontend/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
alembic upgrade head

# Frontend
cd /Users/vickyjaiswal/Documents/erp-frontend/frontend
npm run dev
npm run build  # Test production build locally

# Database
psql -U erp -d erp_demo
brew services start postgresql@16
brew services stop postgresql@16

# Git
git status
git add .
git commit -m "message"
git push origin main
```

### Key Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Backend environment | `backend/.env` |
| `.env.local` | Frontend environment | `frontend/.env.local` |
| `alembic.ini` | Database migrations | `backend/alembic.ini` |
| `next.config.js` | Next.js config | `frontend/next.config.js` |
| `requirements.txt` | Python dependencies | `backend/requirements.txt` |
| `package.json` | Node dependencies | `frontend/package.json` |

---

## Next Steps

### Immediate Actions (Required)

1. ☐ Install PostgreSQL (via Homebrew or Docker)
2. ☐ Create local database and user
3. ☐ Set up backend virtual environment
4. ☐ Configure backend `.env` file
5. ☐ Run database migrations
6. ☐ Create admin user
7. ☐ Start backend server
8. ☐ Configure frontend `.env.local` file
9. ☐ Install frontend dependencies
10. ☐ Start frontend server
11. ☐ Test full workflow (login → create customer)

### Optional Enhancements

1. ☐ Install Docker Desktop (if preferring Docker for PostgreSQL)
2. ☐ Install database GUI tool (pgAdmin, DBeaver, Postico)
3. ☐ Set up IDE (VS Code, PyCharm) with proper extensions
4. ☐ Configure Git hooks for pre-commit checks
5. ☐ Set up automated testing (pytest for backend, Jest for frontend)

### Documentation Updates

1. ☐ Update `README.md` with refined local setup steps
2. ☐ Update `CLAUDE.md` workflow section
3. ☐ Create `DEVELOPMENT.md` for detailed dev practices

---

## Success Criteria

Your local environment is fully functional when:

- ✅ Backend starts without errors on port 8000
- ✅ Frontend starts without errors on port 3000
- ✅ You can login via the web interface
- ✅ You can create/edit/delete a customer
- ✅ Changes to backend code auto-reload
- ✅ Changes to frontend code hot-reload in browser
- ✅ Database changes persist after restart
- ✅ No CORS errors in browser console
- ✅ API documentation accessible at http://localhost:8000/docs

---

## Estimated Time to Complete

| Task | Duration |
|------|----------|
| Install PostgreSQL | 10-15 minutes |
| Database setup | 10 minutes |
| Backend setup | 15-20 minutes |
| Frontend setup | 10-15 minutes |
| Testing & validation | 15-20 minutes |
| **Total** | **60-80 minutes** |

---

## Support Resources

### Official Documentation
- FastAPI: https://fastapi.tiangolo.com/
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/
- SQLAlchemy: https://docs.sqlalchemy.org/
- Alembic: https://alembic.sqlalchemy.org/

### Project Documentation
- [README.md](README.md) - Project overview
- [CLAUDE.md](CLAUDE.md) - AI assistant guide
- [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) - Deployment roadmap

### Useful Tools
- **Database GUI:** [Postico](https://eggerapps.at/postico/) (Mac), pgAdmin, DBeaver
- **API Testing:** [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/)
- **IDE:** [VS Code](https://code.visualstudio.com/), [PyCharm](https://www.jetbrains.com/pycharm/)

---

**Document Version:** 1.0
**Last Updated:** December 2, 2024
**Author:** Claude (AI Assistant)
**Status:** Ready for Implementation
