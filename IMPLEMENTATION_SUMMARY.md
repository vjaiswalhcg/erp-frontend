# ERP Frontend/Backend Status (Dec 2025)

## Completed
- AuthN/Z: JWT access/refresh, roles (admin/manager/staff/viewer), guarded APIs, login page + route guard.
- Admin user management: create/update users (first/last/phone, role, active), admin-only UI at `/dashboard/admin/users`.
- CRUD stabilized: Orders/Invoices/Payments with create/edit/delete; async lazy-load issues fixed.
- UI polish: CRM View branding, gradients, top-right user menu (initials + profile details), dashboard KPI cards using live data.

## In Progress / Pending
- Reporting/analytics: revenue trends, recent activity, outstanding invoices.
- Auth polish: password reset (and/or OAuth); tighter role-based UI gating on actions.
- Data entry: multi-line items in order/invoice dialogs; PDF/print for invoices (future).
- Quality/CI: automated tests (unit/component/E2E) and CI/CD; error boundary/loading skeletons/accessibility.

## Recent Files of Interest
- Backend auth: `backend/app/api/v1/endpoints/auth.py`, `backend/app/core/auth.py`, `backend/app/core/security.py`, `backend/app/models/user.py`, `backend/app/api/v1/endpoints/users.py`, `backend/app/schemas/user.py`.
- Frontend auth/UI: `frontend/app/login/page.tsx`, `frontend/components/layout/UserMenu.tsx`, `frontend/components/layout/DashboardLayout.tsx`, `frontend/lib/auth.ts`, `frontend/hooks/use-auth.ts`.
- Admin users: `frontend/app/dashboard/admin/users/page.tsx`, `frontend/lib/api/users.ts`.
- Dashboard data: `frontend/app/dashboard/page.tsx`.

## DB Notes
- Ensure `user` table has `first_name`, `last_name`, `phone`, and role enum (`admin|manager|staff|viewer`).
- Existing tables: `orderline`, `invoice_line` naming matched in ORM; notes/description columns added for orders/invoices.

## Deploy Reminders
1) `git pull origin main`
2) Backend: `gcloud run deploy erp-backend --source . --region=us-central1 --allow-unauthenticated --clear-base-image`
3) Frontend: `gcloud run deploy erp-frontend --source . --region=us-central1 --allow-unauthenticated --clear-base-image`
4) Seed admin via `/auth/register` (admin role) then login at `/login`.
