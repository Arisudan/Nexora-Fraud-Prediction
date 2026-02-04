# ============================================================
# NEXORA FRAUD PREDICTOR - Stop All Servers
# ============================================================
# Run this to stop all running servers
# ============================================================

$Host.UI.RawUI.WindowTitle = "Nexora - Stopping Servers"

Write-Host "`n============================================================" -ForegroundColor Red
Write-Host "   🛑 STOPPING NEXORA FRAUD PREDICTOR SERVERS" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Red

Write-Host "`n🔄 Stopping all Node.js processes..." -ForegroundColor Yellow

# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear ports
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

Start-Sleep -Seconds 1

Write-Host "`n✅ All servers stopped!" -ForegroundColor Green
Write-Host "`n   Port 5000 (Backend): " -NoNewline
$p5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($p5000) { Write-Host "Still in use" -ForegroundColor Red } else { Write-Host "Free" -ForegroundColor Green }

Write-Host "   Port 3000 (Frontend): " -NoNewline
$p3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($p3000) { Write-Host "Still in use" -ForegroundColor Red } else { Write-Host "Free" -ForegroundColor Green }

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
