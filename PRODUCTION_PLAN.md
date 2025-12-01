# Production Readiness Plan

## Overview

This document tracks the work needed to make the ERP system production-ready for pilot use.

## Completed ✅

### Phase 1: Security Hardening (Completed Nov 30, 2024)
- [x] Removed exposed credentials file (`notes.txt`)
- [x] Removed build artifacts (`backend.zip`, `frontend.zip`)
- [x] Fixed hardcoded API URL in frontend (now uses environment variable)
- [x] Fixed CORS configuration (now uses environment variable, not `*`)
- [x] Added `env.example` files for both backend and frontend
- [x] **Disabled public registration** - `/register` endpoint commented out
- [x] Added root endpoint (`/`) for service info and health check

### Documentation Cleanup (Completed Nov 30, 2024)
- [x] Deleted 25+ outdated/duplicate documentation files
- [x] Deleted legacy shell scripts
- [x] Created consolidated `README.md`
- [x] Updated `IMPLEMENTATION_SUMMARY.md`
- [x] Updated `CLAUDE.md` with correct paths
- [x] Added `DEPRECATED.md` to old backend folder

### Phase 2: Feature Completion (Completed Nov 30, 2024)
- [x] **Multiple line items** for orders and invoices
  - Dynamic add/remove line items in Order and Invoice dialogs
  - Auto-populate price from product selection
  - Live subtotal calculation
- [x] **Granular role-based UI permissions**
  - Created `usePermissions` hook
  - Hide create/edit/delete buttons based on user role
  - Applied to Customers, Products, Orders, Invoices, Payments tables
- [x] **Dashboard analytics**
  - Added stat cards with icons (Customers, Products, Orders, Revenue)
  - Outstanding invoices and total payments metrics
  - Orders by status breakdown
  - Invoices by status breakdown
  - Recent orders list (last 5)
  - Recent payments list (last 5)

### Deployment Fixes (Completed Nov 30, 2024)
- [x] Fixed Next.js build-time environment variable issue
  - Production API URL now hardcoded in `next.config.js` as fallback
  - `NEXT_PUBLIC_*` variables are baked at build time, not runtime
- [x] Removed `slowapi` rate limiting (causing container startup failures)
  - Rate limiting can be re-added later with Redis backend
- [x] Fixed TypeScript null check errors in dialog components
- [x] Documented correct deployment URLs

## Current Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://erp-frontend-377784510062.us-central1.run.app |
| Backend | https://erp-backend-fb7fdd6n4a-uc.a.run.app |
| API Docs | https://erp-backend-fb7fdd6n4a-uc.a.run.app/docs |

> **Note:** There are two URL formats in Cloud Run. The backend uses the service-based URL (`fb7fdd6n4a-uc`), while the frontend uses the project-based URL.

## Remaining Work

### Phase 3: Quality & DevOps (Medium Priority)
- [ ] **Rotate all secrets** in production
  - Change DATABASE_URL password
  - Generate new SECRET_KEY
  - Document in secure location (not Git!)
- [ ] **Add rate limiting** (with Redis backend)
  - Use Redis or Cloud Memorystore for rate limit storage
  - Prevents brute force attacks on login
- [ ] **Add automated tests**
  - Backend: pytest with async support
  - Frontend: Jest + React Testing Library
  - E2E: Playwright or Cypress
- [ ] **Set up CI/CD pipeline**
  - GitHub Actions for build/test/deploy
  - Automatic deployment on merge to main
- [ ] **Add error boundaries**
  - React error boundaries for graceful failure
  - Loading skeletons while data fetches
- [ ] **Add audit logging**
  - Track who changed what and when
  - Store in database or external service

### Phase 3.5: UI/UX Improvements (Completed Dec 1, 2024)
- [x] **Enhanced table pages** for all modules (Customers, Products, Orders, Invoices, Payments, Admin Users)
  - Stats cards with color-coded metrics at top of each page
  - Distinct search & filter section with visual grouping
  - Full pagination with page numbers (10 items per page)
  - Improved table styling (header contrast, alternating rows, hover states)
  - Empty state with "Clear filters" option
  - Animated loading spinners

### Phase 4: Advanced Features (Lower Priority)
- [ ] **Password reset flow**
  - Add forgot password endpoint
  - Send reset email (requires email service integration)
- [ ] **Salesforce Integration**
  - Named Credentials setup
  - Webhook endpoints for data sync
  - External ID mapping
- [ ] **Invoice PDF generation**
  - Generate downloadable PDF invoices
  - Include company branding
- [ ] **Email notifications**
  - Order confirmation
  - Invoice sent
  - Payment received
- [x] ~~**Enhanced search and filtering**~~ (COMPLETED)
  - ~~Add search to all list views~~ ✅ All modules have search
  - ~~Date range filters~~ ✅ Sort by date options
  - ~~Status filters~~ ✅ All modules have status filters

## Deployment Commands

### Backend Deployment
```bash
cd ~/erp-monorepo/backend
git pull origin main

gcloud run deploy erp-backend --source . --region us-central1 \
  --update-env-vars="CORS_ORIGINS=https://erp-frontend-377784510062.us-central1.run.app"
```

### Frontend Deployment
```bash
cd ~/erp-monorepo/frontend
git pull origin main

gcloud run deploy erp-frontend --source . --region us-central1 \
  --platform managed --allow-unauthenticated
```

> **Important:** The frontend `NEXT_PUBLIC_API_URL` is hardcoded in `next.config.js` for build-time availability. Cloud Run env vars alone don't work for Next.js public variables.

## Deployment Checklist

Before each production deployment:

### Pre-Deployment
- [ ] All changes committed and pushed to GitHub
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Environment variables updated if needed
- [ ] Database migrations tested locally

### Deployment
- [ ] Deploy backend first
- [ ] Run database migrations (if any)
- [ ] Verify backend health: `curl https://erp-backend-fb7fdd6n4a-uc.a.run.app/`
- [ ] Deploy frontend
- [ ] Verify frontend loads

### Post-Deployment
- [ ] Test login flow
- [ ] Test CRUD operations (create customer, order, etc.)
- [ ] Check error handling
- [ ] Monitor logs for errors

## Environment Configuration

### Production Backend (Cloud Run Environment Variables)
```bash
DATABASE_URL=postgresql+psycopg_async://user:PASSWORD@/erp_demo?host=/cloudsql/PROJECT:REGION:INSTANCE
SECRET_KEY=your-secure-random-key-here
CORS_ORIGINS=https://erp-frontend-377784510062.us-central1.run.app
```

### Production Frontend
The API URL is configured in `next.config.js`:
```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1'
```

## Troubleshooting

### "Network Error" on frontend
- Check if backend URL in `next.config.js` is correct
- Verify CORS_ORIGINS on backend includes frontend URL
- Check browser console for actual error

### Container fails to start
- Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME --region=us-central1 --limit=30`
- Common causes: missing env vars (DATABASE_URL), import errors

### TypeScript build fails
- Run `npm run build` locally first
- Check for null/undefined handling in optional chains

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Cloud SQL | db-f1-micro | $7-10 |
| Cloud Run (Backend) | Pay per use | $0-5 |
| Cloud Run (Frontend) | Pay per use | $0-5 |
| Cloud Build | Free tier | $0 |
| **Total** | | **$10-20/month** |

---

*Last Updated: December 1, 2024*
