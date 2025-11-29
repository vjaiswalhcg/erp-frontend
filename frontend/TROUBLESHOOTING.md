# Deployment Troubleshooting

## Check Build Logs

First, check the build logs to see what failed:

```bash
# View recent build logs
gcloud builds list --limit=5

# Get the build ID from the error message or the list above, then:
gcloud builds log <BUILD_ID>
```

## Common Issues & Fixes

### Issue 1: Missing package-lock.json

**Error:** `npm ci` requires package-lock.json

**Fix:** Generate package-lock.json first:
```bash
cd frontend
npm install
git add package-lock.json
```

Then redeploy.

### Issue 2: Build timeout or memory issues

**Fix:** Use Cloud Build directly with more resources:

```bash
# Create cloudbuild.yaml first (see below)
gcloud builds submit --config cloudbuild.yaml
```

### Issue 3: Dockerfile issues

**Fix:** Use simpler Dockerfile without standalone mode:

```bash
# Backup current Dockerfile
mv Dockerfile Dockerfile.backup

# Create new simplified Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
EOF

# Try deploying again
./deploy.sh
```

## Alternative Deployment Methods

### Method 1: Use Cloud Build Configuration

Create a `cloudbuild.yaml` file:

```bash
cat > cloudbuild.yaml << 'EOF'
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/erp-frontend', '.']

  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/erp-frontend']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'erp-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/erp-frontend'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key'

images:
  - 'gcr.io/$PROJECT_ID/erp-frontend'

options:
  machineType: 'E2_HIGHCPU_8'
  timeout: '1200s'
EOF

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

### Method 2: Simplified Next.js Deployment

If Docker continues to fail, use the buildpack approach:

```bash
# Remove Dockerfile temporarily
mv Dockerfile Dockerfile.disabled

# Deploy without Dockerfile (uses buildpacks)
gcloud run deploy erp-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 600
```

### Method 3: Pre-build Locally (if you can install Docker)

If you have Docker locally:

```bash
# Build the image
docker build -t gcr.io/erp-backend-app/erp-frontend .

# Push to Google Container Registry
docker push gcr.io/erp-backend-app/erp-frontend

# Deploy the pre-built image
gcloud run deploy erp-frontend \
  --image gcr.io/erp-backend-app/erp-frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key"
```

## Check for Specific Errors

### If logs show: "Cannot find module"

Missing dependencies. Fix:
```bash
rm -rf node_modules package-lock.json
npm install
# Commit package-lock.json if using git
```

### If logs show: "Module build failed"

TypeScript or build errors. Test locally:
```bash
npm run build
```

Fix any errors shown, then redeploy.

### If logs show: "ELIFECYCLE"

Build script failed. Check package.json has:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## Increase Build Resources

If build is timing out:

```bash
gcloud run deploy erp-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10
```

## Verify Files Before Deploy

Make sure these files exist:

```bash
ls -la
# Should see:
# - package.json
# - package-lock.json (important!)
# - next.config.js
# - tsconfig.json
# - Dockerfile
# - All source files in app/, components/, lib/
```

## Next Steps After Fix

1. Share the actual error from build logs
2. Try the simplified Dockerfile above
3. If still failing, try Method 2 (buildpack without Dockerfile)
4. Check that all required files are present in Cloud Shell
