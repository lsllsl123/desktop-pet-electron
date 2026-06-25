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

function Test-CheckerPass {
    param([Parameter(Mandatory=$true)][string]$Path)

    if (-not (Test-Path $Path)) {
        return [pscustomobject]@{ passed = $false; details = "$Path is missing." }
    }

    try {
        $json = Get-Content -Raw $Path | ConvertFrom-Json
        $verdict = [string]$json.verdict
        return [pscustomobject]@{
            passed = ($verdict -eq "PASS")
            details = "$Path verdict=$verdict"
        }
    } catch {
        return [pscustomobject]@{ passed = $false; details = "$Path is not valid JSON: $($_.Exception.Message)" }
    }
}

$checks = [System.Collections.Generic.List[object]]::new()

$checkerReports = @(
    "loop\reports\phase-3-checker.json",
    "loop\reports\phase-3-deferred2-checker.json",
    "loop\reports\phase-3-deferred3-checker.json",
    "loop\reports\phase-3-deferred4-checker.json",
    "loop\reports\phase-3-deferred5-checker.json",
    "loop\reports\phase-3-deferred6-checker.json"
)

foreach ($report in $checkerReports) {
    $result = Test-CheckerPass $report
    Add-Check $checks "checker PASS: $report" $result.passed $result.details
}

Add-Check $checks "phase 3 closeout report exists" (Test-Path "loop\reports\phase-3-closeout.md") "Expected closeout report."

$forbiddenPaths = @(
    "src\shared\externalPlugins.ts",
    "src\shared\pluginLoader.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "Closeout must not add external plugin/backend features."
}

if (Test-Path "package.json") {
    $npmTest = Invoke-CommandCapture "npm test"
    Add-Check $checks "npm test" ($npmTest.exitCode -eq 0) $npmTest.output

    $npmTypecheck = Invoke-CommandCapture "npm run typecheck"
    Add-Check $checks "npm run typecheck" ($npmTypecheck.exitCode -eq 0) $npmTypecheck.output

    $npmBuild = Invoke-CommandCapture "npm run build"
    Add-Check $checks "npm run build" ($npmBuild.exitCode -eq 0) $npmBuild.output
} else {
    Add-Check $checks "npm test" $false "Skipped because package.json does not exist."
    Add-Check $checks "npm run typecheck" $false "Skipped because package.json does not exist."
    Add-Check $checks "npm run build" $false "Skipped because package.json does not exist."
}

$failed = @($checks | Where-Object { -not $_.passed })
$result = [pscustomobject]@{
    phase = "phase3-closeout"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "All Phase 3 user-facing features work together in the running Electron app",
        "No external plugin loading, backend, notification, upload, or cloud behavior is present",
        "Phase 3 backlog is closed and no next slice starts automatically"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
