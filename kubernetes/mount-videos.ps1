# Mount host directories into Minikube for video access
# Run this BEFORE deploying backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mounting Video Directories to Minikube" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Get-Location
$videosPath = "$projectRoot\BACKEND\videos"
$processedPath = "$projectRoot\BACKEND\videos_processed"

Write-Host "Videos directory: $videosPath" -ForegroundColor Yellow
Write-Host "Processed directory: $processedPath" -ForegroundColor Yellow
Write-Host ""

# Check if directories exist
if (-not (Test-Path $videosPath)) {
    Write-Host "Creating videos directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $videosPath -Force | Out-Null
}

if (-not (Test-Path $processedPath)) {
    Write-Host "Creating videos_processed directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $processedPath -Force | Out-Null
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Run these commands in SEPARATE terminals" -ForegroundColor Red
Write-Host "Keep them running in the background!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 (Videos mount):" -ForegroundColor Yellow
Write-Host "  minikube mount ""$videosPath"":/hosthome/videos" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Processed videos mount):" -ForegroundColor Yellow
Write-Host "  minikube mount ""$processedPath"":/hosthome/videos_processed" -ForegroundColor White
Write-Host ""
Write-Host "After mounting, apply backend deployment:" -ForegroundColor Green
Write-Host "  kubectl apply -f kubernetes/backend-deployment.yaml" -ForegroundColor White
Write-Host ""
