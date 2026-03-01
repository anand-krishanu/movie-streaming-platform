# Quick Kubernetes Deployment Script
# Skips build if images already exist - Much Faster!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick K8s Deployment (1 replica per service)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: Run from project root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
docker ps 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Docker is running" -ForegroundColor Green

# Step 2: Check/Start Minikube
Write-Host ""
Write-Host "[2/6] Checking Minikube..." -ForegroundColor Yellow
$minikubeStatus = & "$env:USERPROFILE\minikube.exe" status 2>&1 | Out-String
if ($minikubeStatus -notmatch "Running") {
    Write-Host "Starting Minikube..." -ForegroundColor Yellow
    & "$env:USERPROFILE\minikube.exe" start --driver=docker --cpus=2 --memory=3072
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to start Minikube" -ForegroundColor Red
        exit 1
    }
}
Write-Host "SUCCESS: Minikube is running" -ForegroundColor Green

# Step 3: Check if images exist, build only if missing
Write-Host ""
Write-Host "[3/6] Checking Docker images..." -ForegroundColor Yellow

$needsBuild = $false
$images = @(
    "movie-streaming-platform-backend:latest",
    "movie-streaming-platform-frontend:latest",
    "movie-streaming-platform-ml-service:latest"
)

foreach ($img in $images) {
    docker image inspect $img 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Missing image: $img" -ForegroundColor Yellow
        $needsBuild = $true
    }
}

if ($needsBuild) {
    Write-Host "Building missing images (this will take a few minutes)..." -ForegroundColor Yellow
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "SUCCESS: All images exist, skipping build" -ForegroundColor Green
}

# Step 4: Tag and Load images
Write-Host ""
Write-Host "[4/6] Loading images into Minikube..." -ForegroundColor Yellow
docker tag movie-streaming-platform-backend:latest movie-streaming-backend:latest
docker tag movie-streaming-platform-frontend:latest movie-streaming-frontend:latest
docker tag movie-streaming-platform-ml-service:latest movie-streaming-ml-service:latest

& "$env:USERPROFILE\minikube.exe" image load movie-streaming-backend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-frontend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-ml-service:latest
Write-Host "SUCCESS: Images loaded" -ForegroundColor Green

# Step 5: Create namespace and configs
Write-Host ""
Write-Host "[5/6] Creating namespace and configs..." -ForegroundColor Yellow
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml

# Create secrets if .env exists
if (Test-Path ".env") {
    $envVars = @{}
    Get-Content .env | ForEach-Object {
        if ($_ -match '^FIREBASE_' -and $_ -notmatch '^VITE_' -and $_ -match '=') {
            $parts = $_ -split '=', 2
            $envVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
    
    kubectl delete secret firebase-secrets -n movie-platform --ignore-not-found=true | Out-Null
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
      --namespace=movie-platform | Out-Null
}
Write-Host "SUCCESS: Configs created" -ForegroundColor Green

# Step 6: Deploy services
Write-Host ""
Write-Host "[6/6] Deploying services (1 replica each)..." -ForegroundColor Yellow
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/ml-service-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
Write-Host "SUCCESS: Services deployed" -ForegroundColor Green

# Show status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting 10 seconds for pods to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

kubectl get pods -n movie-platform
Write-Host ""
kubectl get services -n movie-platform

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Access Application:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run in separate terminals:" -ForegroundColor White
Write-Host "  kubectl port-forward -n movie-platform service/frontend-service 3000:3000" -ForegroundColor Cyan
Write-Host "  kubectl port-forward -n movie-platform service/backend-service 8080:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
