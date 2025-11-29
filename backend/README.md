# Backend (FastAPI)

## Structure
- `app/main.py`: FastAPI app
- `app/api/v1/endpoints/`: REST endpoints for customers, products, orders, invoices, payments
- `app/models`: SQLAlchemy models
- `app/schemas`: Pydantic schemas/validation
- `app/core`: settings + simple bearer auth
- `alembic/`: migrations

## Environment
Create `.env` from the example:
```
DATABASE_URL=postgresql+psycopg_async://user:password@host:5432/erp_demo
SECRET_KEY=your-shared-token
```

## Local run
```
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Auth: send `Authorization: Bearer <SECRET_KEY>`.

## Migrations
- Create new migration: `alembic revision -m "msg" --autogenerate`
- Apply: `alembic upgrade head`

## Deployment (Cloud Run)
1) Build & push:
   ```
   gcloud builds submit --config cloudbuild.yaml \
     --substitutions=LOCATION=us-central1,CLOUDSQL_INSTANCE=project:region:instance,DATABASE_URL=...,SECRET_KEY=...
   ```
2) The Cloud Build file deploys Cloud Run with env vars and Cloud SQL connection.
3) Run migrations (one-off job or separate task) using the same image/env vars.

## API highlights (all under `/api/v1`, bearer protected)
- `GET/POST /customers`
- `GET/POST /products`
- `POST /orders` with lines, `POST /orders/{id}/confirm`
- `POST /invoices` (from order or custom lines), `POST /invoices/{id}/post`
- `POST /payments`, `POST /payments/{id}/apply`
- Health: `/healthz`
