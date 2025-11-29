#!/bin/bash

# Frontend deployment script for Google Cloud Run
# Run this in Google Cloud Shell after uploading the frontend directory

set -e

echo "=========================================="
echo "Deploying ERP Frontend to Cloud Run"
echo "=========================================="
echo ""

# Set project
echo "Setting project to erp-backend-app..."
gcloud config set project erp-backend-app

# Deploy to Cloud Run
echo ""
echo "Deploying frontend to Cloud Run..."
echo "This will take 3-5 minutes..."
echo ""

gcloud run deploy erp-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your frontend is now live at:"
echo "https://erp-frontend-377784510062.us-central1.run.app"
echo ""
echo "Backend API:"
echo "https://erp-backend-377784510062.us-central1.run.app/api/v1"
echo ""
echo "Test the application:"
echo "1. Open the frontend URL in your browser"
echo "2. Navigate to Customers page"
echo "3. Create a new customer"
echo "4. Navigate to Products page"
echo "5. Create a new product"
echo ""
