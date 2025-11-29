# Manual Deployment Steps for Google Cloud Shell

Use these commands one at a time to identify where the process is hanging.

## Prerequisites

- You're in Google Cloud Shell
- You've uploaded the `backend` folder
- You're in the `backend` directory (`cd backend`)

---

## Step 1: Verify Project Setup

```bash
# Check current project
gcloud config get-value project

# If needed, set your project
# gcloud config set project YOUR_PROJECT_ID
```

---

## Step 2: Enable Required APIs (1-2 minutes)

```bash
echo "Enabling APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
echo "Done!"
```

**If this hangs:** Your project might not have billing enabled. Check in the console.

---

## Step 3: Create Cloud SQL Instance (5-10 minutes)

**IMPORTANT:** This step takes the longest. Don't interrupt it.

```bash
# Set variables
export REGION="us-central1"
export INSTANCE_NAME="erp-db-instance"
export DB_PASS="YourSecurePassword123"  # Change this!

# Check if instance already exists
gcloud sql instances describe $INSTANCE_NAME 2>/dev/null

# If it doesn't exist, create it (THIS TAKES 5-10 MINUTES)
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --cpu=1 \
  --memory=3840MiB \
  --region=$REGION \
  --root-password="$DB_PASS"
```

**If this hangs:**

- It's normal for this to take 5-10 minutes
- You should see progress messages
- If it's been more than 15 minutes with no output, press Ctrl+C and check the console

---

## Step 4: Create Database

```bash
export DB_NAME="erp"

gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME
```

---

## Step 5: Create Database User

```bash
export DB_USER="erp_user"

gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --password="$DB_PASS"
```

---

## Step 6: Build and Deploy (3-5 minutes)

```bash
# Get project ID
export PROJECT_ID=$(gcloud config get-value project)

# Build connection string
export CONNECTION_NAME="$PROJECT_ID:$REGION:$INSTANCE_NAME"
export DATABASE_URL="postgresql+psycopg_async://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
export SECRET_KEY="super-secret-key-change-me"

# Submit build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_LOCATION="$REGION",_DATABASE_URL="$DATABASE_URL",_SECRET_KEY="$SECRET_KEY",_CLOUDSQL_INSTANCE="$CONNECTION_NAME" \
  .
```

**If this hangs:**

- Check if `cloudbuild.yaml` exists in the current directory
- Check Cloud Build logs in the console

---

## Step 7: Get Service URL

```bash
gcloud run services describe erp-backend \
  --region=$REGION \
  --format='value(status.url)'
```

---

## Troubleshooting Commands

### Check Cloud SQL instance status

```bash
gcloud sql instances describe $INSTANCE_NAME --format="value(state)"
```

### Check Cloud Build logs

```bash
gcloud builds list --limit=5
```

### Check Cloud Run services

```bash
gcloud run services list
```

### Delete everything and start over

```bash
# Delete Cloud Run service
gcloud run services delete erp-backend --region=$REGION

# Delete Cloud SQL instance (WARNING: This deletes all data)
gcloud sql instances delete $INSTANCE_NAME
```

---

## Common Issues

### "Billing not enabled"

- Go to console.cloud.google.com
- Navigate to Billing
- Enable billing for your project

### "Permission denied"

- Make sure you're the owner or have the necessary roles
- Run: `gcloud projects get-iam-policy YOUR_PROJECT_ID`

### "Cloud SQL instance creation timeout"

- This is normal if it takes 5-10 minutes
- Check the console: SQL → Instances
- You should see the instance being created

### "Cloud Build fails"

- Check the logs in Cloud Build console
- Common issue: Missing `cloudbuild.yaml` or `Dockerfile`
