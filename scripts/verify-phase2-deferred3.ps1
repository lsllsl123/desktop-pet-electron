Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Add-Check {
    param(
        [System.Collections.Generic.List[object]]$Checks,
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][bool]$Passed,
        [Parameter(Mandatory=$true)][string]$Details
    )

    $Checks.Add([pscustomobject]@{
        name = $Name
        passed = $Passed
        details = $Details
    }) | Out-Null
}

function Invoke-CommandCapture {
    param([Parameter(Mandatory=$true)][string]$Command)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & cmd /c $Command 2>&1 | ForEach-Object { $_.ToString() }
        return [pscustomobject]@{
            exitCode = $LASTEXITCODE
            output = ($output -join "`n")
        }
    } finally {
        $ErrorActionPreference = $previousPreference
    }
}

$checks = [System.Collections.Generic.List[object]]::new()

Add-Check $checks "phase 2 deferred slice 2 report exists" (Test-Path "loop\reports\phase-2-deferred2-acceptance.md") "Pixelator slice builds on accepted deferred slice 2."
Add-Check $checks "phase 2 deferred slice 3 maker prompt exists" (Test-Path "loop\prompts\maker-phase2-deferred3.md") "Maker prompt must define authorized local pixelator slice."
Add-Check $checks "phase 2 deferred slice 3 checker prompt exists" (Test-Path "loop\prompts\checker-phase2-deferred3.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "image pixelator module exists" (Test-Path "src\shared\imagePixelator.ts") "Expected deterministic local image pixelator module."
Add-Check $checks "image pixelator tests exist" (Test-Path "src\shared\imagePixelator.test.ts") "Expected tests for pixelator behavior."
Add-Check $checks "phase 2 deferred slice 3 acceptance report exists" (Test-Path "loop\reports\phase-2-deferred3-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\customCharacterManager.ts",
    "src\shared\startupLaunch.ts",
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated deferred or Phase 3 features."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "no file upload UI added" (-not ($appText -match 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader')) "This slice should stay as local processing module only."
} else {
    Add-Check $checks "no file upload UI added" $false "src\App.tsx is missing."
}

if (Test-Path "package.json") {
    $npmTest = Invoke-CommandCapture "npm test -- --runInBand"
    if ($npmTest.exitCode -ne 0) {
        $npmTest = Invoke-CommandCapture "npm test"
    }
    Add-Check $checks "npm test" ($npmTest.exitCode -eq 0) $npmTest.output

    $npmBuild = Invoke-CommandCapture "npm run build"
    Add-Check $checks "npm run build" ($npmBuild.exitCode -eq 0) $npmBuild.output
} else {
    Add-Check $checks "npm test" $false "Skipped because package.json does not exist."
    Add-Check $checks "npm run build" $false "Skipped because package.json does not exist."
}

$failed = @($checks | Where-Object { -not $_.passed })
$result = [pscustomobject]@{
    phase = "phase2-deferred3"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Local RGBA input can be converted to pixel-art output",
        "Palette quantization behaves as expected",
        "No file upload UI, remote upload, backend, or character manager behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
