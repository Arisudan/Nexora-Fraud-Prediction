# ============================================================
# NEXORA FRAUD PREDICTOR - Project Starter Script
# ============================================================

$Host.UI.RawUI.WindowTitle = "Nexora Fraud Predictor - Project Runner"

# Project paths
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   NEXORA FRAUD PREDICTOR - Project Starter" -ForegroundColor White
Write-Host "   Crowd Intelligence Powered Fraud Detection" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# ============================================================
# STEP 1: Kill existing processes on required ports
# ============================================================
Write-Host ""
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Cyan

# Kill process on port 5000 (Backend)
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    $port5000 | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "   Killed existing process on port 5000" -ForegroundColor Yellow
}

# Kill process on port 3000 (Frontend)
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $port3000 | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "   Killed existing process on port 3000" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2
Write-Host "   Ports cleared successfully" -ForegroundColor Green

# ============================================================
# STEP 2: Check if MongoDB is running
# ============================================================
Write-Host ""
Write-Host "Step 2: Checking MongoDB connection..." -ForegroundColor Cyan

$mongoRunning = $false
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($mongoCheck) {
        Write-Host "   MongoDB is running on port 27017" -ForegroundColor Green
        $mongoRunning = $true
    }
}
catch {
    Write-Host "   Could not verify MongoDB status" -ForegroundColor Yellow
}

if (-not $mongoRunning) {
    Write-Host "   WARNING: MongoDB may not be running!" -ForegroundColor Red
    Write-Host "   The backend may fail to connect to database." -ForegroundColor Yellow
}

# ============================================================
# STEP 3: Start Backend Server
# ============================================================
Write-Host ""
Write-Host "Step 3: Starting Backend Server..." -ForegroundColor Cyan

$backendCmd = "cd '$backendPath'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 3

# Verify backend started
$backendRunning = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "   Backend server started on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "   Backend may still be starting..." -ForegroundColor Yellow
}

# ============================================================
# STEP 4: Start Frontend Server
# ============================================================
Write-Host ""
Write-Host "Step 4: Starting Frontend Server..." -ForegroundColor Cyan

$frontendCmd = "cd '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 5

# Verify frontend started
$frontendRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "   Frontend server started on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "   Frontend may still be starting (Next.js takes a moment)..." -ForegroundColor Yellow
}

# ============================================================
# STEP 5: Display Summary
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   PROJECT STARTED SUCCESSFULLY!" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green

Write-Host ""
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Health:    http://localhost:5000/health" -ForegroundColor Yellow
Write-Host "   WebSocket: ws://localhost:5000" -ForegroundColor Yellow

Write-Host ""
Write-Host "   Two new terminal windows have opened:" -ForegroundColor Gray
Write-Host "      - Backend terminal (Node.js server)" -ForegroundColor Gray
Write-Host "      - Frontend terminal (Next.js dev server)" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

# ============================================================
# STEP 6: Open browser (optional)
# ============================================================
Write-Host ""
$response = Read-Host "   Open browser now? (Y/n)"
if ($response -ne "n") {
    Start-Process "http://localhost:3000"
    Write-Host "   Browser opened!" -ForegroundColor Green
}

Write-Host ""
Write-Host "   To stop the servers, close the terminal windows." -ForegroundColor Gray
Write-Host ""
Write-Host "   Press any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
