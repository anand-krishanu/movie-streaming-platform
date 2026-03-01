# PowerShell script to deploy Movie Streaming Platform to Kubernetes
# Run this script from the project root directory
# This script will: Check Docker -> Build Images -> Start Minikube -> Deploy to K8s

# Check if running from correct directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Movie Streaming Platform - K8s Deployment" -ForegroundColor Cyan
Write-Host "Full Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker Desktop
Write-Host "[1/10] Checking Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker ps 2>&1 | Out-Null
    $dockerRunning = $LASTEXITCODE -eq 0
}
catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "ERROR: Docker Desktop is not running. Please start Docker Desktop and wait for it to be ready." -ForegroundColor Red
    Write-Host "  Waiting 30 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check again
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker is still not ready. Please start Docker Desktop manually and run this script again." -ForegroundColor Red
        exit 1
    }
}
Write-Host "SUCCESS: Docker Desktop is running" -ForegroundColor Green

# Step 2: Check MongoDB
Write-Host ""
Write-Host "[2/10] Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = $false
try {
    $mongoStatus = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongoStatus -and $mongoStatus.Status -eq 'Running') {
        $mongoRunning = $true
    }
}
catch {
    $mongoRunning = $false
}

if (-not $mongoRunning) {
    Write-Host "Warning: MongoDB is not running. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service -Name MongoDB -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Write-Host "Success: MongoDB started" -ForegroundColor Green
    }
    catch {
        Write-Host "Warning: Could not start MongoDB automatically. Make sure MongoDB is running." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Success: MongoDB is running" -ForegroundColor Green
}

# Step 3: Build Docker images
Write-Host ""
Write-Host "[3/10] Building Docker images..." -ForegroundColor Yellow
Write-Host "  This may take 3-5 minutes on first run..." -ForegroundColor Gray
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build Docker images" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Docker images built successfully" -ForegroundColor Green

# Step 4: Check and start Minikube
Write-Host ""
Write-Host "[4/10] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = & "$env:USERPROFILE\minikube.exe" status 2>&1 | Out-String
if ($minikubeStatus -match "Running") {
    Write-Host "SUCCESS: Minikube is already running" -ForegroundColor Green
}
else {
    Write-Host "Warning: Minikube is not running. Starting Minikube..." -ForegroundColor Yellow
    Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray
    & "$env:USERPROFILE\minikube.exe" start --driver=docker --cpus=4 --memory=4096
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to start Minikube" -ForegroundColor Red
        exit 1
    }
    Write-Host "SUCCESS: Minikube started successfully" -ForegroundColor Green
}

# Step 5: Tag Docker images
Write-Host ""
Write-Host "[5/10] Tagging Docker images for Kubernetes..." -ForegroundColor Yellow
docker tag movie-streaming-platform-backend:latest movie-streaming-backend:latest
docker tag movie-streaming-platform-frontend:latest movie-streaming-frontend:latest
docker tag movie-streaming-platform-ml-service:latest movie-streaming-ml-service:latest
Write-Host "SUCCESS: Images tagged" -ForegroundColor Green

# Step 6: Load images into Minikube
Write-Host ""
Write-Host "[6/10] Loading images into Minikube..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-backend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-frontend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-ml-service:latest
Write-Host "SUCCESS: Images loaded into Minikube" -ForegroundColor Green

# Step 7: Create namespace
Write-Host ""
Write-Host "[7/10] Creating Kubernetes namespace..." -ForegroundColor Yellow
kubectl apply -f kubernetes/namespace.yaml
Write-Host "SUCCESS: Namespace created" -ForegroundColor Green

# Step 8: Create ConfigMap
Write-Host ""
Write-Host "[8/10] Creating ConfigMap..." -ForegroundColor Yellow
kubectl apply -f kubernetes/configmap.yaml
Write-Host "SUCCESS: ConfigMap created" -ForegroundColor Green

# Step 9: Create Firebase secrets from .env file
Write-Host ""
Write-Host "[9/10] Creating Firebase secrets..." -ForegroundColor Yellow

# Load environment variables from .env file
$envVars = @{}
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^FIREBASE_' -and $_ -notmatch '^VITE_' -and $_ -match '=') {
            $parts = $_ -split '=', 2
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $envVars[$key] = $value
        }
    }
    
    # Delete existing secret if it exists
    kubectl delete secret firebase-secrets -n movie-platform --ignore-not-found=true | Out-Null
    
    # Create secret
    kubectl create secret generic firebase-secrets `
      --from-literal=type="$($envVars['FIREBASE_TYPE'])" `
      --from-literal=project_id="$($envVars['FIREBASE_PROJECT_ID'])" `
      --from-literal=private_key_id="$($envVars['FIREBASE_PRIVATE_KEY_ID'])" `
      --from-literal=private_key="$($envVars['FIREBASE_PRIVATE_KEY'])" `
      --from-literal=client_email="$($envVars['FIREBASE_CLIENT_EMAIL'])" `
      --from-literal=client_id="$($envVars['FIREBASE_CLIENT_ID'])" `
      --from-literal=auth_uri="$($envVars['FIREBASE_AUTH_URI'])" `
      --from-literal=token_uri="$($envVars['FIREBASE_TOKEN_URI'])" `
      --from-literal=auth_provider_x509_cert_url="$($envVars['FIREBASE_AUTH_PROVIDER_X509_CERT_URL'])" `
      --from-literal=client_x509_cert_url="$($envVars['FIREBASE_CLIENT_X509_CERT_URL'])" `
      --from-literal=universe_domain="$($envVars['FIREBASE_UNIVERSE_DOMAIN'])" `
      --namespace=movie-platform
    
    Write-Host "SUCCESS: Firebase secrets created" -ForegroundColor Green
}
else {
    Write-Host "Warning: .env file not found. Skipping Firebase secrets creation." -ForegroundColor Yellow
}

# Step 10: Deploy all services
Write-Host ""
Write-Host "[10/10] Deploying services to Kubernetes..." -ForegroundColor Yellow

Write-Host "  - Deploying Redis..." -ForegroundColor Cyan
kubectl apply -f kubernetes/redis-deployment.yaml

Write-Host "  - Deploying ML Service..." -ForegroundColor Cyan
kubectl apply -f kubernetes/ml-service-deployment.yaml

Write-Host "  - Deploying Backend..." -ForegroundColor Cyan
kubectl apply -f kubernetes/backend-deployment.yaml

Write-Host "  - Deploying Frontend..." -ForegroundColor Cyan
kubectl apply -f kubernetes/frontend-deployment.yaml

Write-Host "SUCCESS: All services deployed" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host ""
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
Write-Host "  This may take 1-2 minutes..." -ForegroundColor Gray

Start-Sleep -Seconds 15

# Show deployment status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
kubectl get pods -n movie-platform
Write-Host ""
kubectl get services -n movie-platform

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Access Your Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands in separate terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Frontend):" -ForegroundColor Cyan
Write-Host "  kubectl port-forward -n movie-platform service/frontend-service 3000:3000" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Backend):" -ForegroundColor Cyan
Write-Host "  kubectl port-forward -n movie-platform service/backend-service 8080:8080" -ForegroundColor White
Write-Host ""
Write-Host "Then open your browser:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Yellow
Write-Host "  Check pods:     kubectl get pods -n movie-platform" -ForegroundColor Gray
Write-Host "  View logs:      kubectl logs -n movie-platform -l app=backend" -ForegroundColor Gray
Write-Host "  Stop Minikube:  minikube stop" -ForegroundColor Gray
Write-Host "  Delete all:     kubectl delete namespace movie-platform" -ForegroundColor Gray
