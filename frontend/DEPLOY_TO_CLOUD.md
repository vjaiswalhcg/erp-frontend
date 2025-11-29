# Deploy Frontend to Google Cloud Run

This guide will help you deploy the Next.js frontend to Google Cloud Run using Google Cloud Shell.

## 📋 Prerequisites

- Google Cloud Project: `erp-backend-app` (Project ID: `erp-backend-app`)
- Backend already deployed at: `https://erp-backend-377784510062.us-central1.run.app`
- Access to Google Cloud Console

## 🚀 Deployment Steps

### Step 1: Open Google Cloud Shell

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in project `erp-backend-app`
3. Click the **Cloud Shell** icon (>_) in the top right corner

### Step 2: Clone or Upload Frontend Code

If you have the code in a Git repository:
```bash
git clone <your-repo-url>
cd <repo-name>/frontend
```

**OR** if uploading files manually:

1. In Cloud Shell, click the **three dots menu** (⋮) → **Upload**
2. Upload the entire `frontend` folder as a ZIP file
3. Unzip it:
```bash
unzip frontend.zip
cd frontend
```

**OR** create the files directly in Cloud Shell by following the "Create Files in Cloud Shell" section below.

### Step 3: Create Dockerfile

Create a `Dockerfile` in the `frontend/` directory:

```bash
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF
```

### Step 4: Create .dockerignore

```bash
cat > .dockerignore << 'EOF'
node_modules
.next
.git
.gitignore
README.md
SETUP.md
DEPLOY_TO_CLOUD.md
*.md
.env*.local
EOF
```

### Step 5: Update next.config.js for Cloud Run

```bash
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  },
}

module.exports = nextConfig
EOF
```

### Step 6: Deploy to Cloud Run

Run the deployment command:

```bash
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
```

**What this does:**
- Creates a container from your Next.js app
- Deploys it to Cloud Run in `us-central1` region
- Sets environment variables for API connection
- Allows public access (no authentication required)
- Allocates 512MB RAM and 1 CPU
- Auto-scales from 0 to 10 instances

### Step 7: Wait for Deployment

The deployment will take 3-5 minutes. You'll see output like:

```
Building using Buildpacks and deploying container to Cloud Run service [erp-frontend]...
✓ Creating Container Repository...
✓ Uploading sources...
✓ Building Container...
✓ Creating Revision...
✓ Routing traffic...
Done.
Service [erp-frontend] revision [erp-frontend-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://erp-frontend-377784510062.us-central1.run.app
```

### Step 8: Test the Deployment

Once deployed, open the Service URL in your browser:

```
https://erp-frontend-377784510062.us-central1.run.app
```

You should see:
1. The app redirects to `/dashboard`
2. Sidebar navigation on the left
3. Dashboard with metric cards
4. Click "Customers" to see the customer you created earlier
5. Click "Products" to see the product you created earlier

## 🧪 Testing the Application

### Test Customer Management
1. Click **"Customers"** in the sidebar
2. Click **"Add Customer"** button
3. Fill in the form:
   - Name: "Test Customer 2"
   - Email: "test2@example.com"
   - Phone: "+1 555 0102"
   - Currency: "USD"
4. Click **"Create"**
5. Verify the customer appears in the table

### Test Product Management
1. Click **"Products"** in the sidebar
2. Click **"Add Product"** button
3. Fill in the form:
   - SKU: "WIDGET-002"
   - Name: "Standard Widget"
   - Price: 49.99
   - Currency: "USD"
4. Click **"Create"**
5. Verify the product appears in the table

## 📊 View Logs

To view application logs:

```bash
gcloud run services logs read erp-frontend \
  --region us-central1 \
  --limit 50
```

## 🔄 Redeploy After Changes

If you make changes to the frontend code:

1. Update files in Cloud Shell
2. Run the same deployment command again:

```bash
gcloud run deploy erp-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://erp-backend-377784510062.us-central1.run.app/api/v1,NEXT_PUBLIC_API_KEY=my-api-secret-key"
```

## 🌐 Custom Domain (Optional)

To add a custom domain:

1. In Cloud Console, go to **Cloud Run** → **erp-frontend**
2. Click **"Manage Custom Domains"**
3. Follow the wizard to add your domain

## 💰 Cost Estimate

Cloud Run pricing (as of 2025):
- **CPU**: $0.00002400/vCPU-second
- **Memory**: $0.00000250/GiB-second
- **Requests**: $0.40 per million requests
- **Free tier**: 2 million requests/month, 360,000 vCPU-seconds, 180,000 GiB-seconds

**Estimated monthly cost for low traffic:**
- ~100 requests/day: **FREE** (within free tier)
- ~1,000 requests/day: **~$1-2/month**
- ~10,000 requests/day: **~$5-10/month**

With `min-instances=0`, you only pay when the app is actively serving requests.

## 🔧 Troubleshooting

### Error: Build failed
```bash
# Check build logs
gcloud run services logs read erp-frontend --region us-central1

# Common fix: Ensure package.json has all dependencies
npm install
```

### Error: Can't connect to backend
- Verify backend is running: `https://erp-backend-377784510062.us-central1.run.app/docs`
- Check environment variables are set correctly in Cloud Run console

### Error: Port binding failed
- The Dockerfile is configured for port 3000, which Cloud Run automatically maps to port 8080

### Update Environment Variables
If you need to change API URL or key:

```bash
gcloud run services update erp-frontend \
  --region us-central1 \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://new-url.com/api/v1,NEXT_PUBLIC_API_KEY=new-key"
```

## ✅ Deployment Complete!

Your frontend is now live at:
```
https://erp-frontend-377784510062.us-central1.run.app
```

Connected to backend at:
```
https://erp-backend-377784510062.us-central1.run.app/api/v1
```

---

## 📝 Alternative: Create Files in Cloud Shell

If you want to create all files directly in Cloud Shell instead of uploading:

### 1. Create directory structure
```bash
mkdir -p frontend/{app/{dashboard/{customers,products}},components/{layout,customers,products,ui},lib/{api,types},hooks}
cd frontend
```

### 2. Initialize npm and install dependencies
```bash
npm init -y
npm install next@14.1.3 react@18.2.0 react-dom@18.2.0 \
  @tanstack/react-query@5.28.4 axios@1.6.7 \
  react-hook-form@7.51.0 @hookform/resolvers@2.9.11 \
  zod@3.22.4 clsx@2.1.0 tailwind-merge@2.2.1 \
  class-variance-authority@0.7.0 lucide-react@0.344.0 \
  @radix-ui/react-dialog@1.0.5 @radix-ui/react-label@2.0.2 \
  @radix-ui/react-slot@1.0.2 @radix-ui/react-toast@1.1.5

npm install -D typescript@5.3.3 @types/node@20.11.20 \
  @types/react@18.2.58 @types/react-dom@18.2.19 \
  tailwindcss@3.4.1 postcss@8.4.35 autoprefixer@10.4.18 \
  eslint@8.57.0 eslint-config-next@14.1.3
```

### 3. Copy files one by one
You'll need to create each file using the `cat` command or `nano` editor. For example:

```bash
# Create package.json
cat > package.json << 'EOF'
[paste package.json content]
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
[paste tsconfig.json content]
EOF

# And so on for each file...
```

This is tedious, so **uploading a ZIP file or using Git clone is recommended**.
