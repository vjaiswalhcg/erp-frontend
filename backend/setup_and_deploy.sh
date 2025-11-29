#!/bin/bash
# Verbose deployment script with progress tracking

echo "============================================================"
echo "ERP Backend - Google Cloud Setup & Deploy (Verbose Mode)"
echo "============================================================"
echo ""

# Function to print status messages
print_status() {
    echo ""
    echo ">>> $1"
    echo ""
}

# Function to handle errors
handle_error() {
    echo ""
    echo "ERROR: $1"
    echo "Please check the error message above and try again."
    exit 1
}

# 1. Configuration
print_status "STEP 1: Getting project configuration..."
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
echo "Current Project: $PROJECT_ID"

if [ -z "$PROJECT_ID" ]; then
  handle_error "No project selected. Run: gcloud config set project YOUR_PROJECT_ID"
fi

echo ""
read -p "Enter Region (default: us-central1): " REGION
REGION=${REGION:-us-central1}
echo "Using region: $REGION"

INSTANCE_NAME="erp-db-instance"
DB_NAME="erp"
DB_USER="erp_user"

echo ""
echo -n "Enter Database Password for '$DB_USER': "
read -s DB_PASS
echo ""
if [ -z "$DB_PASS" ]; then
  handle_error "Password cannot be empty"
fi

# 2. Enable APIs
print_status "STEP 2: Enabling Google Cloud APIs (this may take 1-2 minutes)..."
echo "Enabling: Cloud Run, Cloud Build, Cloud SQL, Container Registry, Artifact Registry"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com || handle_error "Failed to enable APIs"
echo "✓ APIs enabled successfully"

# 3. Cloud SQL Setup
print_status "STEP 3: Setting up Cloud SQL..."

# Check if instance exists
echo "Checking if Cloud SQL instance exists..."
if gcloud sql instances describe $INSTANCE_NAME --format="value(name)" 2>/dev/null | grep -q "$INSTANCE_NAME"; then
  echo "✓ Instance '$INSTANCE_NAME' already exists. Skipping creation."
else
  print_status "Creating Cloud SQL instance '$INSTANCE_NAME'..."
  echo "⏳ This will take 5-10 minutes. Please be patient..."
  echo "Starting at: $(date)"
  gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --cpu=1 \
    --memory=3840MiB \
    --region=$REGION \
    --root-password="$DB_PASS" || handle_error "Failed to create Cloud SQL instance"
  echo "✓ Instance created at: $(date)"
fi

# Create Database
echo ""
echo "Checking if database exists..."
if gcloud sql databases describe $DB_NAME --instance=$INSTANCE_NAME --format="value(name)" 2>/dev/null | grep -q "$DB_NAME"; then
  echo "✓ Database '$DB_NAME' already exists."
else
  echo "Creating database '$DB_NAME'..."
  gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME || handle_error "Failed to create database"
  echo "✓ Database created"
fi

# Create User
echo ""
echo "Checking if user exists..."
if gcloud sql users list --instance=$INSTANCE_NAME --format="value(name)" 2>/dev/null | grep -q "^$DB_USER$"; then
  echo "✓ User '$DB_USER' already exists. Updating password..."
  gcloud sql users set-password $DB_USER --instance=$INSTANCE_NAME --password="$DB_PASS" || handle_error "Failed to update user password"
else
  echo "Creating user '$DB_USER'..."
  gcloud sql users create $DB_USER --instance=$INSTANCE_NAME --password="$DB_PASS" || handle_error "Failed to create user"
  echo "✓ User created"
fi

# 4. Deploy
print_status "STEP 4: Building and deploying to Cloud Run..."
CONNECTION_NAME="$PROJECT_ID:$REGION:$INSTANCE_NAME"
DATABASE_URL="postgresql+psycopg_async://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
SECRET_KEY="super-secret-key-change-me"

echo "Configuration:"
echo "  - Connection: $CONNECTION_NAME"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo ""
echo "⏳ Starting Cloud Build (this may take 3-5 minutes)..."
echo "Starting at: $(date)"

gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_LOCATION="$REGION",_DATABASE_URL="$DATABASE_URL",_SECRET_KEY="$SECRET_KEY",_CLOUDSQL_INSTANCE="$CONNECTION_NAME" \
  . || handle_error "Cloud Build failed"

echo ""
echo "✓ Build completed at: $(date)"

print_status "DEPLOYMENT COMPLETE!"
echo "Your API should now be running on Cloud Run."
echo "To get the URL, run: gcloud run services describe erp-backend --region=$REGION --format='value(status.url)'"
echo "============================================================"
