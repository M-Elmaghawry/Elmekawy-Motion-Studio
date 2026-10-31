$ErrorActionPreference = 'Stop'
$studioRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$compilerPath = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compilerPath)) {
    $compilerPath = Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe'
}
if (-not (Test-Path -LiteralPath $compilerPath)) {
    throw 'The Windows .NET Framework C# compiler is unavailable.'
}
$launcherSource = Join-Path $studioRoot 'tools/launcher/Program.cs'
$launcherOutput = Join-Path $studioRoot 'Elmekawy-Motion-Studio.exe'
& $compilerPath /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 "/out:$launcherOutput" /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Web.Extensions.dll $launcherSource
if ($LASTEXITCODE -ne 0) { throw 'Launcher compilation failed.' }
$launcherFile = Get-Item -LiteralPath $launcherOutput
Write-Output ('Built ' + $launcherFile.FullName + ' (' + $launcherFile.Length + ' bytes)')
