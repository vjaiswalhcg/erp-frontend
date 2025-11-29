# Fresh Start Guide: Delete Old Project & Create New

This guide will walk you through completely starting fresh with a new Google Cloud project.

---

## Part 1: Delete the Old Project

### Step 1: Go to Google Cloud Console

1. Open your browser and go to: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Log in with your Google account

### Step 2: Navigate to Project Settings

1. Click on the **project dropdown** at the top of the page (next to "Google Cloud")
2. You'll see a list of your projects
3. Find the project you want to delete
4. Click the **three-dot menu (⋮)** next to the project name
5. Select **"Settings"**

### Step 3: Delete the Project

1. Scroll down to the **"Shut down"** section
2. Click **"SHUT DOWN"**
3. Type the **Project ID** to confirm (it will show you what to type)
4. Click **"SHUT DOWN"** again

**Note:** The project will be scheduled for deletion in 30 days. During this time, it's marked for deletion and won't incur charges.

---

## Part 2: Create a New Project

### Step 1: Create New Project

1. In the Google Cloud Console, click the **project dropdown** at the top
2. Click **"NEW PROJECT"**
3. Fill in the details:
   - **Project name**: `erp-backend-app` (or whatever you prefer)
   - **Organization**: Leave as default (No organization)
   - **Location**: Leave as default
4. Click **"CREATE"**

### Step 2: Wait for Project Creation

- This takes about 30 seconds
- You'll see a notification when it's ready

### Step 3: Enable Billing

**CRITICAL:** Without billing, nothing will work.

1. Go to: [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. Select your new project from the dropdown
3. Click **"LINK A BILLING ACCOUNT"**
4. If you don't have a billing account:
   - Click **"CREATE BILLING ACCOUNT"**
   - Follow the prompts to add a credit card
   - Don't worry: Google Cloud has a free tier, and this small app won't cost much
5. Link the billing account to your project

### Step 4: Verify Billing is Enabled

1. Go to: [https://console.cloud.google.com/billing/projects](https://console.cloud.google.com/billing/projects)
2. Find your new project
3. Make sure it shows **"Billing enabled"** or has a billing account linked

---

## Part 3: Upload Your Files to Cloud Shell

### Step 1: Open Cloud Shell

1. In the Google Cloud Console (make sure your NEW project is selected)
2. Click the **Cloud Shell icon (>\_)** in the top-right corner
3. A terminal will open at the bottom of the browser

### Step 2: Verify You're in the Right Project

In Cloud Shell, run:

```bash
gcloud config get-value project
```

If it shows the wrong project, set it:

```bash
gcloud config set project YOUR_NEW_PROJECT_ID
```

### Step 3: Upload the Backend Folder

**Method 1: Upload via Cloud Shell Menu (Easiest)**

1. In Cloud Shell, click the **three-dot menu (⋮)** in the top-right
2. Select **"Upload"** → **"Upload folder"**
3. Navigate to: `c:\VickyJaiswal\VickyWork_2025\PERSONAL\Projects\EDW\backend`
4. Select the **backend** folder
5. Click **"Upload"**
6. Wait for the upload to complete (you'll see progress)

**Method 2: Upload via Drag & Drop**

1. Open your file explorer: `c:\VickyJaiswal\VickyWork_2025\PERSONAL\Projects\EDW`
2. Drag the **backend** folder into the Cloud Shell terminal window
3. Wait for upload to complete

### Step 4: Verify Upload

In Cloud Shell, run:

```bash
ls -la
cd backend
ls -la
```

You should see all your files (Dockerfile, cloudbuild.yaml, app folder, etc.)

---

## Part 4: Deploy Using the Automated Script

### Step 1: Make Script Executable

```bash
chmod +x setup_and_deploy.sh
```

### Step 2: Run the Deployment Script

```bash
./setup_and_deploy.sh
```

### Step 3: Follow the Prompts

The script will ask you for:

1. **Region**: Press Enter to use `us-central1` (recommended)
2. **Database Password**: Enter a strong password (e.g., `MySecurePass123!`)
   - **IMPORTANT:** Remember this password!
   - The password won't be visible as you type (this is normal)

### Step 4: Wait for Completion

The script will:

- ✅ Enable APIs (1-2 minutes)
- ✅ Create Cloud SQL instance (5-10 minutes) ⏳ **This is the longest step**
- ✅ Create database and user (30 seconds)
- ✅ Build and deploy (3-5 minutes)

**Total time: 10-15 minutes**

### Step 5: Get Your Service URL

When complete, run:

```bash
gcloud run services describe erp-backend --region=us-central1 --format='value(status.url)'
```

This will output your API URL. Copy it!

### Step 6: Test Your API

```bash
# Replace YOUR_URL with the URL from the previous step
curl YOUR_URL/healthz
```

You should see: `{"status":"ok"}`

You can also visit `YOUR_URL/docs` in your browser to see the API documentation.

---

## Part 5: If Something Goes Wrong

### Use Manual Deployment

If the automated script hangs again, use the manual approach:

1. Open the file `MANUAL_DEPLOY.md` in Cloud Shell:

   ```bash
   cat MANUAL_DEPLOY.md
   ```

2. Copy and run commands **one at a time**

3. Tell me which specific command hangs, and I'll help you debug

### Check Logs

```bash
# Check Cloud Build logs
gcloud builds list --limit=5

# Check Cloud Run logs
gcloud run services describe erp-backend --region=us-central1
```

---

## Quick Reference: Project Info

After creation, save this info:

- **Project ID**: ********\_********
- **Project Name**: ********\_********
- **Region**: us-central1
- **Database Password**: ********\_******** (keep this secure!)

---

## Estimated Costs

For this small demo app:

- **Cloud Run**: ~$0-5/month (free tier covers most of it)
- **Cloud SQL**: ~$10-15/month (smallest instance)
- **Total**: ~$10-20/month

You can delete everything when done to avoid charges.

---

## Need Help?

If you get stuck at any step, tell me:

1. Which step you're on
2. What error message you see (if any)
3. A screenshot if possible

I'll help you troubleshoot! 🚀
