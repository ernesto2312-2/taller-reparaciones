# Arranca PocketBase usando el esquema y los hooks versionados en el repositorio.
# Uso:  .\scripts\start-pocketbase.ps1
#       .\scripts\start-pocketbase.ps1 --dev   (logs SQL detallados)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$exe = Join-Path $root 'Poket Base\pocketbase.exe'
if (-not (Test-Path $exe)) {
  $exe = Join-Path $root 'pocketbase.exe'
}
if (-not (Test-Path $exe)) {
  throw "No se encontró pocketbase.exe. Descárguelo de https://pocketbase.io/docs/ y colóquelo en 'Poket Base\' o en la raíz del proyecto."
}

$data = Join-Path $root 'Poket Base\pb_data'
$migrations = Join-Path $root 'pb_migrations'
$hooks = Join-Path $root 'pb_hooks'

New-Item -ItemType Directory -Force -Path $data | Out-Null

Write-Host "PocketBase: $exe"
Write-Host "Datos:      $data"
Write-Host "Migraciones:$migrations"
Write-Host "Hooks:      $hooks"
Write-Host ""

& $exe serve '--http=127.0.0.1:8090' "--dir=$data" "--migrationsDir=$migrations" "--hooksDir=$hooks" @args
