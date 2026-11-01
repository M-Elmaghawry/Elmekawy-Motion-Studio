$ErrorActionPreference = 'Stop'
$studioRoot = 'D:\zz-CODING\Elmekawy-Motion-Studio'
$launcherFile = Join-Path $studioRoot 'Elmekawy-Motion-Studio.exe'
$oldHostId = 12728
$oldLauncherId = 27532
$storeLock = Get-Content -LiteralPath (Join-Path $studioRoot '.studio/server.lock') -Raw | ConvertFrom-Json
if ($storeLock.pid -ne $oldHostId -or $storeLock.port -ne 4311) { throw 'The running Studio changed; no process was stopped.' }
$oldLauncher = Get-Process -Id $oldLauncherId -ErrorAction Stop
if ($oldLauncher.Path -ine $launcherFile) { throw 'Launcher identity mismatch; no process was stopped.' }
$runningJobs = @()
foreach ($jobFile in Get-ChildItem -LiteralPath (Join-Path $studioRoot '.studio/jobs') -Filter '*.json' -File) {
    $job = Get-Content -LiteralPath $jobFile.FullName -Raw | ConvertFrom-Json
    if ($job.state -in @('queued', 'bundling', 'resolving', 'rendering', 'verifying')) { $runningJobs += $job }
}
if ($runningJobs.Count -gt 0) { throw 'An active production render exists; no process was stopped.' }
$preflightProcess = Start-Process -FilePath $launcherFile -ArgumentList '--check' -WorkingDirectory $studioRoot -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $studioRoot '.studio/test-runs/phase4-work/preflight.out.log') -RedirectStandardError (Join-Path $studioRoot '.studio/test-runs/phase4-work/preflight.err.log')
if ($preflightProcess.ExitCode -ne 0) { throw 'New application preflight failed; existing Studio was left running.' }
# Closing the owner closes its private stdin pipe; launcher-host then shuts down gracefully.
Stop-Process -Id $oldLauncherId -ErrorAction Stop
Wait-Process -Id $oldHostId -Timeout 20 -ErrorAction SilentlyContinue
if (Get-Process -Id $oldHostId -ErrorAction SilentlyContinue) { throw 'The old server has not finished its graceful shutdown.' }
$newLauncher = Start-Process -FilePath $launcherFile -WorkingDirectory $studioRoot -WindowStyle Hidden -PassThru
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
        $options = Invoke-RestMethod -Uri 'http://127.0.0.1:4311/api/flexible/options'
        if ($options.manifest.projectSchemaVersion -eq '2.1.0') { $ready = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 250
}
if (-not $ready) { throw 'The restarted launcher did not expose the new API in time.' }
$newLock = Get-Content -LiteralPath (Join-Path $studioRoot '.studio/server.lock') -Raw | ConvertFrom-Json
@{ oldHost = $oldHostId; newHost = $newLock.pid; launcher = $newLauncher.Id; schema = $options.manifest.projectSchemaVersion; passed = $true } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $studioRoot '.studio/test-runs/phase4-work/live-restart.json') -Encoding UTF8
Write-Output ('Studio restarted at http://127.0.0.1:4311 with schema ' + $options.manifest.projectSchemaVersion)
