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
    param(
        [Parameter(Mandatory=$true)][string]$Command
    )

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

Add-Check $checks "phase 1 verifier exists" (Test-Path "scripts\verify-phase1.ps1") "Phase 2 builds on the accepted Phase 1 verifier."
Add-Check $checks "random event scheduler module exists" (Test-Path "src\shared\randomEventScheduler.ts") "Expected deterministic low-frequency random event scheduler."
Add-Check $checks "hidden mood module exists" (Test-Path "src\shared\moodSystem.ts") "Expected hidden mood system module."
Add-Check $checks "behavior settings module exists" (Test-Path "src\shared\behaviorSettings.ts") "Expected low-resource/random-event behavior settings module."
Add-Check $checks "phase 2 acceptance report exists" (Test-Path "loop\reports\phase-2-acceptance.md") "Phase 2 must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\todoStore.ts",
    "src\shared\imagePixelator.ts",
    "src\shared\customCharacterManager.ts",
    "src\shared\startupLaunch.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "deferred feature absent: $path" (-not (Test-Path $path)) "This first Phase 2 loop must not implement deferred Phase 2 features."
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
    phase = "phase2"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Random event bubbles appear only at low frequency",
        "Random events do not interrupt dragging or exploding",
        "Hidden mood is not shown as raw numeric UI",
        "Low-resource mode visibly reduces optional behavior"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
