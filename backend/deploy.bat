@echo off
REM Windows deployment script for Cloud Run

REM UPDATED WITH YOUR PROJECT DETAILS
SET PROJECT_ID=erp-backend-app
SET PROJECT_NUMBER=377784510062
SET REGION=us-central1
SET SERVICE_NAME=erp-backend
SET DB_INSTANCE=erp-postgres

echo ========================================
echo ERP Backend Deployment to Google Cloud
echo ========================================
echo.

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: gcloud CLI not found!
    echo Please install from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

echo.
echo Getting Cloud SQL connection name...
for /f "delims=" %%i in ('gcloud sql instances describe %DB_INSTANCE% --format="get(connectionName)"') do set CONNECTION_NAME=%%i

if "%CONNECTION_NAME%"=="" (
    echo ERROR: Could not get Cloud SQL connection name
    echo Make sure Cloud SQL instance '%DB_INSTANCE%' exists
    pause
    exit /b 1
)

echo Connection Name: %CONNECTION_NAME%
echo.

REM Prompt for secrets
set /p DB_PASSWORD="Enter database password: "
set /p SECRET_KEY="Enter API secret key: "

SET DATABASE_URL=postgresql+psycopg_async://erp:%DB_PASSWORD%@localhost/erp_demo?host=/cloudsql/%CONNECTION_NAME%

echo.
echo Deploying to Cloud Run...
echo This will build and deploy your application automatically.
echo.

gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --region=%REGION% ^
  --platform=managed ^
  --allow-unauthenticated ^
  --add-cloudsql-instances=%CONNECTION_NAME% ^
  --set-env-vars="DATABASE_URL=%DATABASE_URL%,SECRET_KEY=%SECRET_KEY%" ^
  --port=8080 ^
  --memory=512Mi ^
  --min-instances=0 ^
  --max-instances=10 ^
  --timeout=300

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Deployment Successful!
    echo ========================================
    echo.
    echo Getting service URL...
    for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="get(status.url)"') do set SERVICE_URL=%%i
    echo Service URL: %SERVICE_URL%
    echo Swagger UI: %SERVICE_URL%/docs
    echo.
    echo Test with: curl %SERVICE_URL%/healthz
) else (
    echo.
    echo Deployment failed. Check the errors above.
)

pause
