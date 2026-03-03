# ============================================================================
# Movie Streaming Platform - Automated Setup Script (Windows PowerShell)
# ============================================================================
# This script helps you set up the project on a fresh Windows machine
# Run with: .\setup.ps1
# ============================================================================

param(
    [switch]$SkipInstalls,
    [switch]$SkipEnv
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Movie Streaming Platform - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Test-Command "docker")) {
    $missingTools += "Docker Desktop"
}

if (-not (Test-Command "docker-compose")) {
    $missingTools += "Docker Compose"
}

if (-not (Test-Command "mongod")) {
    $missingTools += "MongoDB"
}

if ($missingTools.Count -gt 0 -and -not $SkipInstalls) {
    Write-Host "⚠️  Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Would you like to install them? (Requires Chocolatey)" -ForegroundColor Yellow
    $install = Read-Host "Install missing tools? (y/n)"
    
    if ($install -eq "y") {
        # Check if Chocolatey is installed
        if (-not (Test-Command "choco")) {
            Write-Host "Installing Chocolatey..." -ForegroundColor Green
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }
        
        foreach ($tool in $missingTools) {
            Write-Host "Installing $tool..." -ForegroundColor Green
            switch ($tool) {
                "Docker Desktop" { choco install docker-desktop -y }
                "MongoDB" { choco install mongodb -y }
            }
        }
        
        Write-Host ""
        Write-Host "✅ Installation complete! Please restart your terminal and run this script again." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Cannot proceed without required tools. Please install them manually." -ForegroundColor Red
        Write-Host "See DEPLOYMENT-GUIDE.md for installation instructions." -ForegroundColor Yellow
        exit 1
    }
} elseif ($missingTools.Count -gt 0) {
    Write-Host "⚠️  Missing tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Please install them manually. See DEPLOYMENT-GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host "✅ All prerequisites installed" -ForegroundColor Green
}

# ============================================================================
# Step 2: Check if .env exists
# ============================================================================
Write-Host ""
Write-Host "[2/6] Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env") -and -not $SkipEnv) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Write-Host "Found .env.example template" -ForegroundColor Green
        $create = Read-Host "Create .env from template? (y/n)"
        
        if ($create -eq "y") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Created .env file" -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  IMPORTANT: You must edit .env and add your Firebase credentials!" -ForegroundColor Red
            Write-Host "   1. Open .env in a text editor" -ForegroundColor Yellow
            Write-Host "   2. Follow instructions in DEPLOYMENT-GUIDE.md to get Firebase credentials" -ForegroundColor Yellow
            Write-Host "   3. Replace all placeholder values" -ForegroundColor Yellow
            Write-Host ""
            $continue = Read-Host "Have you configured .env? (y/n)"
            if ($continue -ne "y") {
                Write-Host "Please configure .env and run this script again." -ForegroundColor Yellow
                exit 0
            }
        } else {
            Write-Host "❌ Cannot proceed without .env file" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ .env.example not found. Cannot create .env" -ForegroundColor Red
        exit 1
    }
} elseif (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Validate that key variables are set
    $envContent = Get-Content ".env" -Raw
    $missingVars = @()
    
    if ($envContent -match "your-project-id") {
        $missingVars += "FIREBASE_PROJECT_ID"
    }
    if ($envContent -match "your-api-key") {
        $missingVars += "VITE_FIREBASE_API_KEY"
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠️  Warning: .env contains placeholder values for:" -ForegroundColor Yellow
        $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
        Write-Host ""
        Write-Host "The application may not work correctly without proper Firebase credentials." -ForegroundColor Yellow
    }
}

# ============================================================================
# Step 3: Start MongoDB
# ============================================================================
Write-Host ""
Write-Host "[3/6] Starting MongoDB..." -ForegroundColor Yellow

try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($mongoService) {
        if ($mongoService.Status -ne "Running") {
            Start-Service -Name "MongoDB"
            Write-Host "✅ MongoDB started" -ForegroundColor Green
        } else {
            Write-Host "✅ MongoDB already running" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  MongoDB service not found. Attempting to start manually..." -ForegroundColor Yellow
        Start-Process "mongod" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "✅ MongoDB started" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not start MongoDB automatically" -ForegroundColor Yellow
    Write-Host "Please start MongoDB manually: net start MongoDB" -ForegroundColor Yellow
}

# ============================================================================
# Step 4: Check Docker
# ============================================================================
Write-Host ""
Write-Host "[4/6] Checking Docker..." -ForegroundColor Yellow

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker is not running" -ForegroundColor Yellow
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# Step 5: Build and Start Services
# ============================================================================
Write-Host ""
Write-Host "[5/6] Building and starting services..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first run..." -ForegroundColor Cyan

try {
    docker-compose up -d --build
    Write-Host "✅ Services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Step 6: Verify Services
# ============================================================================
Write-Host ""
Write-Host "[6/6] Verifying services..." -ForegroundColor Yellow
Write-Host "Waiting for services to become healthy (this may take 1-2 minutes)..." -ForegroundColor Cyan

Start-Sleep -Seconds 10

$services = docker-compose ps --format json | ConvertFrom-Json
$healthy = 0
$total = 0

foreach ($service in $services) {
    $total++
    if ($service.Health -eq "healthy" -or $service.State -eq "running") {
        Write-Host "✅ $($service.Service) is healthy" -ForegroundColor Green
        $healthy++
    } else {
        Write-Host "⚠️  $($service.Service) is $($service.State)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete! ($healthy/$total services healthy)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Green
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "   ML Service: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Green
Write-Host "   View logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services:    docker-compose down" -ForegroundColor White
Write-Host "   Restart:          docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Green
Write-Host "   Setup Guide:      DEPLOYMENT-GUIDE.md" -ForegroundColor White
Write-Host "   How to Run:       HOW-TO-RUN.md" -ForegroundColor White
Write-Host ""

if ($healthy -lt $total) {
    Write-Host "⚠️  Some services are not healthy yet. They may still be starting up." -ForegroundColor Yellow
    Write-Host "   Check logs with: docker-compose logs -f" -ForegroundColor Yellow
}
