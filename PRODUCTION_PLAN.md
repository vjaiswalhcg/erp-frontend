# Production Readiness Plan

## Overview

This document tracks the work needed to make the ERP system production-ready for pilot use.

## Completed ✅

### Security Fixes (Completed Nov 30, 2024)
- [x] Removed exposed credentials file (`notes.txt`)
- [x] Removed build artifacts (`backend.zip`, `frontend.zip`)
- [x] Fixed hardcoded API URL in frontend (now uses environment variable)
- [x] Fixed CORS configuration (now uses environment variable, not `*`)
- [x] Added `env.example` files for both backend and frontend

### Documentation Cleanup (Completed Nov 30, 2024)
- [x] Deleted 25+ outdated/duplicate documentation files
- [x] Deleted legacy shell scripts
- [x] Created consolidated `README.md`
- [x] Updated `IMPLEMENTATION_SUMMARY.md`
- [x] Updated `CLAUDE.md` with correct paths
- [x] Added `DEPRECATED.md` to old backend folder

## Remaining Work

### Phase 1: Security Hardening (High Priority)
- [ ] **Disable public registration** or add admin approval workflow
  - File: `frontend/backend/app/api/v1/endpoints/auth.py`
  - Currently anyone can register, including setting their own role
- [ ] **Add rate limiting** on authentication endpoints
  - Prevent brute force attacks on login
  - Use `slowapi` or similar library
- [ ] **Rotate all secrets** in production
  - Change DATABASE_URL password
  - Generate new SECRET_KEY
  - Document in secure location (not Git!)
- [ ] **Review CORS_ORIGINS** in production deployment
  - Set to exact frontend URL only

### Phase 2: Feature Completion (Medium Priority)
- [ ] **Multiple line items** for orders and invoices
  - Currently limited to single line item per order/invoice
  - Need dynamic form with add/remove line items
- [ ] **Password reset flow**
  - Add forgot password endpoint
  - Send reset email (requires email service integration)
- [ ] **Granular role-based UI permissions**
  - Hide edit/delete buttons for unauthorized roles
  - Currently only admin link is role-gated
- [ ] **Dashboard analytics**
  - Add charts (revenue trends, order trends)
  - Recent activity feed
  - Top customers/products

### Phase 3: Quality & DevOps (Medium Priority)
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

### Phase 4: Advanced Features (Lower Priority)
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
- [ ] **Search and filtering**
  - Add search to all list views
  - Date range filters
  - Status filters

## Deployment Checklist

Before each production deployment:

### Pre-Deployment
- [ ] All changes committed and pushed to GitHub
- [ ] Environment variables updated if needed
- [ ] Secrets rotated if compromised
- [ ] Database migrations tested locally

### Deployment
- [ ] Deploy backend first
- [ ] Run database migrations
- [ ] Verify backend health: `GET /healthz`
- [ ] Deploy frontend
- [ ] Verify frontend loads

### Post-Deployment
- [ ] Test login flow
- [ ] Test CRUD operations
- [ ] Check error handling
- [ ] Monitor logs for errors

## Environment Configuration

### Production Backend
```bash
# Required
DATABASE_URL=postgresql+psycopg_async://user:STRONG_PASSWORD@localhost/erp_demo?host=/cloudsql/PROJECT:REGION:INSTANCE
SECRET_KEY=GENERATE_STRONG_RANDOM_32_CHAR_STRING
CORS_ORIGINS=https://your-frontend-domain.run.app

# Optional
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Production Frontend
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.run.app/api/v1
```

## Monitoring & Logging

### Current State
- Cloud Run provides basic logging
- No alerting configured
- No uptime monitoring

### Recommended
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure log-based metrics
- [ ] Add uptime checks
- [ ] Set up error notification (email/Slack)

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Cloud SQL | db-f1-micro | $7-10 |
| Cloud Run (Backend) | Pay per use | $0-5 |
| Cloud Run (Frontend) | Pay per use | $0-5 |
| Cloud Build | Free tier | $0 |
| **Total** | | **$10-20/month** |

---

*Last Updated: November 30, 2024*

