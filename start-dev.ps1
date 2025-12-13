# ==========================================
# ⚙️ CONFIGURATION - EDIT THIS SECTION
# ==========================================
$ApiFolder     = ".\src\backend\AirbnbClone\Api"      # Name of your .NET folder
$UiFolder      = ".\src\frontend\AirbnbClone"     # Name of your Angular folder
$StripeTarget  = "https://localhost:7088/api/payments/webhook" 
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

# 2. START STRIPE LISTENER
Write-Host "2. Launching Stripe Listener..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command stripe listen --forward-to $StripeTarget"

# 3. START .NET API
Write-Host "3. Launching .NET API..." -ForegroundColor Green
if (Test-Path $ApiFolder) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command cd $ApiFolder; dotnet watch run"
} else {
    Write-Error "❌ Could not find API folder: $ApiFolder"
}

# 4. START ANGULAR
Write-Host "4. Launching Angular Client..." -ForegroundColor Green
if (Test-Path $UiFolder) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command cd $UiFolder; ng serve -o"
} else {
    Write-Error "❌ Could not find Angular folder: $UiFolder"
}

Write-Host "✅ System Startup Complete!" -ForegroundColor Cyan