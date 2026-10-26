$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$extension = Join-Path $root 'extension'
$release = Join-Path $root 'release'
$zip = Join-Path $release 'NovelAI_Helper_v1.05.zip'

if (-not (Test-Path (Join-Path $extension 'manifest.json'))) {
    throw 'extension/manifest.json not found'
}

New-Item -ItemType Directory -Force -Path $release | Out-Null
Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $extension '*') -DestinationPath $zip -CompressionLevel Optimal

$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
$size = (Get-Item -LiteralPath $zip).Length
Write-Host "ZIP: $zip"
Write-Host "Size: $size bytes"
Write-Host "SHA256: $hash"
