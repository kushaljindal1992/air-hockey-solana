# Cloud Run Deployment Script for Air Hockey Game
# Project: psquared-463805
# Region: asia-south2 (Mumbai, India)
# Service: air-hockey-v6-server

$ErrorActionPreference = "Stop"

Write-Host "Deploying Air Hockey Game to Google Cloud Run" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "psquared-463805"
$SERVICE_NAME = "air-hockey-v6-server"
$REGION = "asia-south2"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Navigate to the app directory
$APP_DIR = "c:\Users\bikash kumar yadav\Desktop\air-hockey-6\Air-hockey-game-htmlonly"
Set-Location $APP_DIR

Write-Host "Working directory: $APP_DIR" -ForegroundColor Yellow
Write-Host ""

# Set the Google Cloud project
Write-Host "Setting Google Cloud project..." -ForegroundColor Green
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Green
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

# Build the Docker image using Cloud Build
Write-Host "Building Docker image with Cloud Build..." -ForegroundColor Green
gcloud builds submit --tag $IMAGE_NAME --project=$PROJECT_ID

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Green
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 10 `
    --min-instances 0 `
    --project $PROJECT_ID

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is available at:" -ForegroundColor Cyan
Write-Host "   https://$SERVICE_NAME-582546076.$REGION.run.app" -ForegroundColor Yellow
Write-Host ""
Write-Host "View logs with:" -ForegroundColor Cyan
Write-Host "   gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --limit=50" -ForegroundColor White
Write-Host ""
Write-Host "View service details:" -ForegroundColor Cyan
Write-Host "   gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID" -ForegroundColor White
Write-Host ""
