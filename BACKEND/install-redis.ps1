# Redis Installation Script for Windows
# Run this to install and start Redis on your machine

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Redis Setup for Movie Streaming" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Redis is already running
$redisProcess = Get-Process redis-server -ErrorAction SilentlyContinue
if ($redisProcess) {
    Write-Host "✅ Redis is already running!" -ForegroundColor Green
    Write-Host "   Process ID: $($redisProcess.Id)" -ForegroundColor White
    exit 0
}

Write-Host "📦 Redis Installation Options:`n" -ForegroundColor Yellow

Write-Host "Option 1: Docker (Recommended)" -ForegroundColor Cyan
Write-Host "   1. Start Docker Desktop" -ForegroundColor White
Write-Host "   2. Run: docker run -d --name redis-cache -p 6379:6379 redis:latest" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: WSL (Linux on Windows)" -ForegroundColor Cyan
Write-Host "   1. Run: wsl --install" -ForegroundColor White
Write-Host "   2. Restart computer" -ForegroundColor White
Write-Host "   3. Run in WSL: sudo apt update && sudo apt install redis-server" -ForegroundColor Gray
Write-Host "   4. Run: redis-server" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Native Windows (Quick Start)" -ForegroundColor Cyan
Write-Host "   Download manually:" -ForegroundColor White
Write-Host "   https://github.com/tporadowski/redis/releases" -ForegroundColor Blue
Write-Host "   Extract and run redis-server.exe" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 4: Chocolatey Package Manager" -ForegroundColor Cyan
Write-Host "   Run: choco install redis-64" -ForegroundColor Gray
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "After installing Redis:" -ForegroundColor Yellow
Write-Host "1. Test connection: redis-cli ping" -ForegroundColor White
Write-Host "   (Should return: PONG)" -ForegroundColor Gray
Write-Host "2. Start backend: cd BACKEND && mvn spring-boot:run" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
