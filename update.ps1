# Update and restart the application with latest images from Docker Hub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating Movie Streaming Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and fill in your configuration" -ForegroundColor Yellow
    exit 1
}

# Check if DOCKERHUB_USERNAME is set
$envContent = Get-Content ".env" | Where-Object { $_ -match "^DOCKERHUB_USERNAME=" }
if (-not $envContent -or $envContent -match "your-dockerhub-username") {
    Write-Host "ERROR: DOCKERHUB_USERNAME not configured in .env file!" -ForegroundColor Red
    Write-Host "Please set your Docker Hub username in .env" -ForegroundColor Yellow
    exit 1
}

# Step 1: Pull latest code
Write-Host "[1/4] Pulling latest code from GitHub..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Git pull failed or no changes" -ForegroundColor Yellow
}

# Step 2: Pull latest Docker images
Write-Host ""
Write-Host "[2/4] Pulling latest Docker images from Docker Hub..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull images" -ForegroundColor Red
    Write-Host "Make sure Docker is running and images exist on Docker Hub" -ForegroundColor Yellow
    exit 1
}

# Step 3: Stop current containers
Write-Host ""
Write-Host "[3/4] Stopping current containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

# Step 4: Start with new images
Write-Host ""
Write-Host "[4/4] Starting services with new images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
Start-Sleep -Seconds 5

# Show status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
docker-compose -f docker-compose.prod.yml ps
Write-Host ""
Write-Host "Application is running at:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
Write-Host ""
