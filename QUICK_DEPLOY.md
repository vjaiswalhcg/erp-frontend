# Quick Deploy to Google Cloud Run

The easiest way to deploy the frontend to Google Cloud Run.

## Method 1: Upload ZIP to Cloud Shell (Recommended)

### Step 1: Create a ZIP file
1. On your local machine, compress the entire `frontend` folder into a ZIP file
2. Name it `frontend.zip`

### Step 2: Open Google Cloud Shell
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `erp-backend-app`
3. Click the Cloud Shell icon (>_) in the top-right corner

### Step 3: Upload the ZIP file
1. In Cloud Shell toolbar, click the **three dots menu (⋮)** → **Upload**
2. Select `frontend.zip`
3. Wait for upload to complete

### Step 4: Extract and deploy
Run these commands in Cloud Shell:

```bash
# Extract the ZIP file
unzip frontend.zip

# Navigate to frontend directory
cd frontend

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Step 5: Wait for deployment
The deployment takes **3-5 minutes**. You'll see:
- Building container image
- Pushing to Container Registry
- Deploying to Cloud Run
- Final service URL

### Step 6: Access your app
Once complete, open the URL shown:
```
https://erp-frontend-377784510062.us-central1.run.app
```

---

## Method 2: Manual Commands (If deploy.sh fails)

If the script doesn't work, run this single command in Cloud Shell from the `frontend/` directory:

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

---

## What You Should See

### After Deployment:
```
Service [erp-frontend] revision [erp-frontend-00001-xxx] has been deployed
Service URL: https://erp-frontend-377784510062.us-central1.run.app
```

### In Your Browser:
1. **Home page** → Automatically redirects to `/dashboard`
2. **Dashboard** → Shows 4 metric cards (placeholders)
3. **Sidebar** → Navigation with 6 menu items
4. **Customers page** → Shows existing customer if any, with "Add Customer" button
5. **Products page** → Shows existing product if any, with "Add Product" button

---

## Testing the Application

### Test 1: View Existing Data
1. Click **"Customers"** in sidebar
2. You should see the customer you created earlier via curl
3. Click **"Products"** in sidebar
4. You should see the product you created earlier

### Test 2: Create New Customer
1. Click **"Add Customer"**
2. Fill in:
   - Name: "ACME Corporation"
   - Email: "contact@acme.com"
   - Phone: "+1 555 1234"
   - Currency: "USD"
3. Click **"Create"**
4. Customer should appear in the table

### Test 3: Create New Product
1. Click **"Add Product"**
2. Fill in:
   - SKU: "WIDGET-003"
   - Name: "Deluxe Widget"
   - Price: 199.99
   - Currency: "USD"
3. Click **"Create"**
4. Product should appear in the table

### Test 4: Edit & Delete
1. Click the **pencil icon** to edit a customer/product
2. Modify some fields and save
3. Click the **trash icon** to delete
4. Confirm deletion

---

## Troubleshooting

### Error: "Failed to build"
**Cause:** Missing dependencies or build errors

**Fix:**
```bash
# In Cloud Shell, in the frontend directory
npm install
./deploy.sh
```

### Error: "Permission denied"
**Cause:** deploy.sh not executable

**Fix:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Error: "Cannot connect to API"
**Cause:** Backend might be down or environment variables incorrect

**Fix:**
1. Test backend: `https://erp-backend-377784510062.us-central1.run.app/docs`
2. If backend is down, redeploy it first
3. Verify environment variables in Cloud Run console

### App loads but shows errors
**Check logs:**
```bash
gcloud run services logs read erp-frontend \
  --region us-central1 \
  --limit 50
```

---

## View Deployed Service

### In Cloud Console:
1. Go to **Cloud Run** service
2. Find **erp-frontend**
3. View metrics, logs, and settings

### Service URLs:
- **Frontend**: https://erp-frontend-377784510062.us-central1.run.app
- **Backend**: https://erp-backend-377784510062.us-central1.run.app
- **Backend API Docs**: https://erp-backend-377784510062.us-central1.run.app/docs

---

## Redeploy After Changes

If you make changes to the code:

1. Update files locally
2. Create new ZIP file
3. Upload to Cloud Shell (will overwrite)
4. Run:
```bash
cd frontend
./deploy.sh
```

---

## Cost Information

With the configuration in `deploy.sh`:
- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Min instances**: 0 (scales to zero when not in use)
- **Max instances**: 10

**Expected monthly cost:**
- Low traffic (< 100 requests/day): **FREE** (within free tier)
- Medium traffic (~1,000 requests/day): **$1-3/month**
- High traffic (~10,000 requests/day): **$5-15/month**

Since `min-instances=0`, you only pay when someone uses the app.

---

## Next Steps

After successful deployment:

1. **Test all features** in the deployed app
2. **Share the URL** with stakeholders
3. **Implement remaining features**:
   - Orders management
   - Invoices management
   - Payments management
4. **Add authentication** (currently open to public)
5. **Set up monitoring** in Cloud Console

---

## Support

If you encounter issues:
1. Check [DEPLOY_TO_CLOUD.md](DEPLOY_TO_CLOUD.md) for detailed troubleshooting
2. View logs: `gcloud run services logs read erp-frontend --region us-central1`
3. Check backend health: https://erp-backend-377784510062.us-central1.run.app/health
