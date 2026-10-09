$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4264/health' -TimeoutSec 2
} catch { $health = $null }
if (-not $health -or $health.service -ne 'crevalue') {
    $stateDir = Join-Path $env:LOCALAPPDATA 'Crevalue'
    New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
    $node = (Get-Command node.exe).Source
    Start-Process -FilePath $node -ArgumentList @(('"' + (Join-Path $projectRoot 'scripts/crevalue/server.mjs') + '"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $stateDir 'worker.log') -RedirectStandardError (Join-Path $stateDir 'worker-error.log')
}
Start-Process 'https://bosshw.github.io/cregunseol-app/'
