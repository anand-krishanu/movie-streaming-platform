# PowerShell script to deploy Movie Streaming Platform to Kubernetes
# Run this script from the project root directory

# Check if running from correct directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Movie Streaming Platform - K8s Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Minikube is running
Write-Host "[1/8] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = & "$env:USERPROFILE\minikube.exe" status 2>&1 | Out-String
if ($minikubeStatus -match "Running") {
    Write-Host "✓ Minikube is running" -ForegroundColor Green
} else {
    Write-Host "✗ Minikube is not running. Starting Minikube..." -ForegroundColor Red
    & "$env:USERPROFILE\minikube.exe" start --driver=docker --cpus=4 --memory=4096
    Write-Host "✓ Minikube started" -ForegroundColor Green
}

# Tag Docker images
Write-Host ""
Write-Host "[2/8] Tagging Docker images..." -ForegroundColor Yellow
docker tag movie-streaming-platform-backend:latest movie-streaming-backend:latest
docker tag movie-streaming-platform-frontend:latest movie-streaming-frontend:latest
docker tag movie-streaming-platform-ml-service:latest movie-streaming-ml-service:latest
Write-Host "✓ Images tagged" -ForegroundColor Green

# Load images into Minikube
Write-Host ""
Write-Host "[3/8] Loading images into Minikube..." -ForegroundColor Yellow
Write-Host "  (this may take a while)" -ForegroundColor Gray
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-backend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-frontend:latest
& "$env:USERPROFILE\minikube.exe" image load movie-streaming-ml-service:latest
Write-Host "✓ Images loaded into Minikube" -ForegroundColor Green

# Create namespace
Write-Host ""
Write-Host "[4/8] Creating Kubernetes namespace..." -ForegroundColor Yellow
kubectl apply -f kubernetes/namespace.yaml
Write-Host "✓ Namespace created" -ForegroundColor Green

# Create ConfigMap
Write-Host ""
Write-Host "[5/8] Creating ConfigMap..." -ForegroundColor Yellow
kubectl apply -f kubernetes/configmap.yaml
Write-Host "✓ ConfigMap created" -ForegroundColor Green

# Create Firebase secrets from .env file
Write-Host ""
Write-Host "[6/8] Creating Firebase secrets..." -ForegroundColor Yellow

# Load environment variables from .env file
$envVars = @{}
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

Write-Host "✓ Firebase secrets created" -ForegroundColor Green

# Deploy all services
Write-Host ""
Write-Host "[7/8] Deploying services to Kubernetes..." -ForegroundColor Yellow

Write-Host "  - Deploying Redis..." -ForegroundColor Cyan
kubectl apply -f kubernetes/redis-deployment.yaml

Write-Host "  - Deploying ML Service..." -ForegroundColor Cyan
kubectl apply -f kubernetes/ml-service-deployment.yaml

Write-Host "  - Deploying Backend..." -ForegroundColor Cyan
kubectl apply -f kubernetes/backend-deployment.yaml

Write-Host "  - Deploying Frontend..." -ForegroundColor Cyan
kubectl apply -f kubernetes/frontend-deployment.yaml

Write-Host "✓ All services deployed" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host ""
Write-Host "[8/8] Waiting for deployments to be ready..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

Start-Sleep -Seconds 10

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
Write-Host "To access the frontend, run:" -ForegroundColor Yellow
Write-Host "  & `"`$env:USERPROFILE\minikube.exe`" service frontend-service -n movie-platform" -ForegroundColor White
Write-Host ""
Write-Host "To access the backend, run:" -ForegroundColor Yellow
Write-Host "  & `"`$env:USERPROFILE\minikube.exe`" service backend-service -n movie-platform" -ForegroundColor White
Write-Host ""
Write-Host "Or use port forwarding:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n movie-platform service/frontend-service 3000:3000" -ForegroundColor White
Write-Host "  kubectl port-forward -n movie-platform service/backend-service 8080:8080" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
