# setup_and_deploy.ps1
# Automates the setup and deployment of the ERP Backend to Google Cloud

$ErrorActionPreference = "Stop"

function Write-Header {
    param($Message)
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# --- Configuration ---
Write-Header "ERP Backend - Google Cloud Setup & Deploy"

# Check for gcloud
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "Google Cloud SDK (gcloud) is not installed or not in PATH. Please install it first."
    exit 1
}

# Get Project ID
$currentProject = gcloud config get-value project 2>$null
Write-Info "Current gcloud project: $currentProject"
$projectId = Read-Host "Enter Project ID (Press Enter to use '$currentProject')"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    $projectId = $currentProject
}

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Error "Project ID is required."
    exit 1
}

# Set Project
Write-Info "Setting active project to $projectId..."
gcloud config set project $projectId

# Region
$region = Read-Host "Enter Region (Default: us-central1)"
if ([string]::IsNullOrWhiteSpace($region)) {
    $region = "us-central1"
}

# DB Configuration
$instanceName = "erp-db-instance"
$dbName = "erp"
$dbUser = "erp_user"
$dbPass = Read-Host "Enter Database Password for '$dbUser' (Input hidden)" -AsSecureString
$dbPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

if ([string]::IsNullOrWhiteSpace($dbPassPlain)) {
    Write-Error "Database password is required."
    exit 1
}

# --- Enable APIs ---
Write-Header "Enabling Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com
Write-Success "APIs enabled."

# --- Cloud SQL Setup ---
Write-Header "Setting up Cloud SQL..."

# Check if instance exists
$instanceExists = gcloud sql instances describe $instanceName --format="value(name)" 2>$null
if ($instanceExists) {
    Write-Info "Cloud SQL instance '$instanceName' already exists. Skipping creation."
} else {
    Write-Info "Creating Cloud SQL instance '$instanceName' (This may take 5-10 minutes)..."
    gcloud sql instances create $instanceName --database-version=POSTGRES_15 --cpu=1 --memory=3840MiB --region=$region --root-password=$dbPassPlain
    Write-Success "Cloud SQL instance created."
}

# Create Database
$dbExists = gcloud sql databases describe $dbName --instance=$instanceName --format="value(name)" 2>$null
if ($dbExists) {
    Write-Info "Database '$dbName' already exists."
} else {
    Write-Info "Creating database '$dbName'..."
    gcloud sql databases create $dbName --instance=$instanceName
    Write-Success "Database created."
}

# Create User
$userExists = gcloud sql users describe $dbUser --instance=$instanceName --format="value(name)" 2>$null
if ($userExists) {
    Write-Info "User '$dbUser' already exists. Updating password..."
    gcloud sql users set-password $dbUser --instance=$instanceName --password=$dbPassPlain
} else {
    Write-Info "Creating user '$dbUser'..."
    gcloud sql users create $dbUser --instance=$instanceName --password=$dbPassPlain
    Write-Success "User created."
}

# --- Deployment ---
Write-Header "Deploying to Cloud Run..."

$connectionName = "$projectId:$region:$instanceName"
$databaseUrl = "postgresql+psycopg_async://${dbUser}:${dbPassPlain}@/${dbName}?host=/cloudsql/${connectionName}"
$secretKey = "super-secret-key-change-me" # In production, use Secret Manager

Write-Info "Submitting build..."
gcloud builds submit --config cloudbuild.yaml `
    --substitutions=_LOCATION=$region,_DATABASE_URL="$databaseUrl",_SECRET_KEY="$secretKey",_CLOUDSQL_INSTANCE="$connectionName" `
    .

Write-Success "Deployment initiated! Check the Cloud Build logs for progress."
Write-Info "Once complete, your API will be available at the URL provided in the Cloud Run output."
