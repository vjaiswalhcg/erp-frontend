#!/bin/bash
# Simple deployment script for Cloud Run

# Configuration - UPDATED WITH YOUR PROJECT
PROJECT_ID="erp-backend-app"
PROJECT_NUMBER="377784510062"
REGION="us-central1"
SERVICE_NAME="erp-backend"
DB_INSTANCE="erp-postgres"
DB_NAME="erp_demo"
DB_USER="erp"

# Get the Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='get(connectionName)')

echo "Deploying ERP Backend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Prompt for secrets (you can also use Secret Manager instead)
read -sp "Enter DATABASE_URL password: " DB_PASSWORD
echo ""
read -sp "Enter SECRET_KEY for API auth: " SECRET_KEY
echo ""

# Build DATABASE_URL
DATABASE_URL="postgresql+psycopg_async://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

# Deploy to Cloud Run using gcloud
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="DATABASE_URL=$DATABASE_URL,SECRET_KEY=$SECRET_KEY" \
  --port=8080 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo "Service URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='get(status.url)'
