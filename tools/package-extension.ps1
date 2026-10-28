$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$extension = Join-Path $root 'extension'
$release = Join-Path $root 'release'
$manifest = Join-Path $extension 'manifest.json'

if (-not (Test-Path $manifest)) {
    throw 'extension/manifest.json not found'
}

$version = (Get-Content -LiteralPath $manifest -Raw -Encoding UTF8 | ConvertFrom-Json).version
$zip = Join-Path $release "NovelAI_Helper_v$version.zip"

New-Item -ItemType Directory -Force -Path $release | Out-Null
Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $extension '*') -DestinationPath $zip -CompressionLevel Optimal

$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
$size = (Get-Item -LiteralPath $zip).Length
Write-Host "ZIP: $zip"
Write-Host "Size: $size bytes"
Write-Host "SHA256: $hash"
