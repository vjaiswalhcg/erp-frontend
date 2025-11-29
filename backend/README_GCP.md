# Google Cloud Deployment Guide

This guide will help you deploy your ERP Backend to Google Cloud Platform (GCP) using Cloud Run and Cloud SQL.

## Prerequisites

1.  **Google Cloud SDK**: Ensure you have the `gcloud` CLI installed and authenticated.
    - Run `gcloud init` to set up your account and project.
2.  **Billing Enabled**: Your GCP project must have billing enabled.

## Automated Deployment

We have provided a PowerShell script to automate the setup and deployment process.

1.  Open a PowerShell terminal in the `backend` directory.
2.  Run the script:
    ```powershell
    .\setup_and_deploy.ps1
    ```
3.  Follow the prompts:
    - **Project ID**: Enter your GCP Project ID.
    - **Region**: (Default: us-central1)
    - **DB Password**: Create a strong password for your database user.

The script will:

- Enable necessary Google Cloud APIs (Cloud Run, Cloud Build, Cloud SQL).
- Create a Cloud SQL (PostgreSQL) instance.
- Create the database and user.
- Build the Docker image.
- Deploy the service to Cloud Run with the correct connection settings.

## Manual Deployment Steps

If you prefer to deploy manually or debug issues, follow these steps:

### 1. Set Environment Variables

```powershell
$PROJECT_ID = "your-project-id"
$REGION = "us-central1"
$INSTANCE_NAME = "erp-db-instance"
$DB_NAME = "erp"
$DB_USER = "erp_user"
$DB_PASS = "your-secure-password"
```

### 2. Enable APIs

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com
```

### 3. Create Cloud SQL Instance

```powershell
gcloud sql instances create $INSTANCE_NAME --database-version=POSTGRES_15 --cpu=1 --memory=3840MiB --region=$REGION
```

### 4. Create Database and User

```powershell
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME
gcloud sql users create $DB_USER --instance=$INSTANCE_NAME --password=$DB_PASS
```

### 5. Deploy

```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=_LOCATION=$REGION,_DATABASE_URL="postgresql+psycopg_async://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME}",_SECRET_KEY="your-secret-key",_CLOUDSQL_INSTANCE="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}" .
```
