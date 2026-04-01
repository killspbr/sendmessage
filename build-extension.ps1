# Script para automatizar o empacotamento da extensão e atualização do site
$EXT_VERSION = "1.1.0"
$RELEASE_TIME = Get-Date -Format "dd/MM/yyyy HH:mm"

Write-Host "📦 Empacotando extensão v$EXT_VERSION..." -ForegroundColor Cyan

# Caminhos
$SRC = "g:\Dev\sendmessage\google-maps-extension"
$DEST = "g:\Dev\sendmessage\site\public\download"
$ZIP_PATH =Join-Path $DEST "extension.zip"
$DASH = "g:\Dev\sendmessage\site\src\pages\DashboardPage.tsx"

# Limpeza e preparação
if (!(Test-Path $DEST)) { New-Item -ItemType Directory -Path $DEST | Out-Null }
if (Test-Path $ZIP_PATH) { Remove-Item $ZIP_PATH -Force }

# Compactação
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($SRC, $ZIP_PATH)
Write-Host "✅ Zip gerado em $ZIP_PATH" -ForegroundColor Green

# Atualização Dashboard
if (Test-Path $DASH) {
    $c = Get-Content $DASH -Raw
    $new = $c -replace 'v\d+\.\d+\.\d+ \(Released: .*\)', "v$EXT_VERSION (Released: $RELEASE_TIME)"
    Set-Content $DASH $new
    Write-Host "📱 Site atualizado para v$EXT_VERSION em $RELEASE_TIME" -ForegroundColor Green
}

Write-Host "🚀 Deploy da extensão concluído!" -ForegroundColor Cyan
