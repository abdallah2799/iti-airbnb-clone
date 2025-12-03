# ==========================================
# ⚙️ CONFIGURATION - EDIT THIS SECTION
# ==========================================
$ApiFolder     = ".\src\backend\AirbnbClone\Api"      # Name of your .NET folder
$UiFolder      = ".\src\frontend\AirbnbClone"     # Name of your Angular folder
$PlayitPath    = ".\tools\playit.exe"      # Path to playit.exe
$StripeTarget  = "localhost:5000/api/payments/webhook" 
# ==========================================

Write-Host "🚀 Starting Airbnb Graduation Project..." -ForegroundColor Cyan

# 1. START QDRANT (Docker)
Write-Host "1. Checking Qdrant Container..." -ForegroundColor Green
if (-not (docker ps -q -f name=qdrant)) {
    if (docker ps -aq -f name=qdrant) {
        docker start qdrant
        Write-Host "   Resumed existing Qdrant container."
    } else {
        docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant
        Write-Host "   Created and started new Qdrant container."
    }
} else {
    Write-Host "   Qdrant is already running."
}

# 2. START PLAYIT (Tunnel)
Write-Host "2. Launching Playit.gg..." -ForegroundColor Green
if (Test-Path $PlayitPath) {
    # If secret is missing in config, it might ask manually, or add logic here
    Start-Process -FilePath $PlayitPath -WindowStyle Minimized
} else {
    Write-Warning "⚠️ Could not find playit.exe at $PlayitPath"
}

# 3. START STRIPE LISTENER
Write-Host "3. Launching Stripe Listener..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command stripe listen --forward-to $StripeTarget"

# 4. START .NET API
Write-Host "4. Launching .NET API..." -ForegroundColor Green
if (Test-Path $ApiFolder) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command cd $ApiFolder; dotnet watch run"
} else {
    Write-Error "❌ Could not find API folder: $ApiFolder"
}

# 5. START ANGULAR
Write-Host "5. Launching Angular Client..." -ForegroundColor Green
if (Test-Path $UiFolder) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command cd $UiFolder; ng serve -o"
} else {
    Write-Error "❌ Could not find Angular folder: $UiFolder"
}

Write-Host "✅ System Startup Complete!" -ForegroundColor Cyan