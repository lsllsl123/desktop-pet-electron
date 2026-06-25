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

Add-Check $checks "phase 2 deferred slice 1 report exists" (Test-Path "loop\reports\phase-2-deferred1-acceptance.md") "Reminder slice builds on accepted deferred slice 1."
Add-Check $checks "phase 2 deferred slice 2 maker prompt exists" (Test-Path "loop\prompts\maker-phase2-deferred2.md") "Maker prompt must define authorized reminder slice."
Add-Check $checks "phase 2 deferred slice 2 checker prompt exists" (Test-Path "loop\prompts\checker-phase2-deferred2.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "reminder store module exists" (Test-Path "src\shared\reminderStore.ts") "Expected deterministic local reminder store."
Add-Check $checks "reminder store tests exist" (Test-Path "src\shared\reminderStore.test.ts") "Expected tests for reminder behavior."
Add-Check $checks "phase 2 deferred slice 2 acceptance report exists" (Test-Path "loop\reports\phase-2-deferred2-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\imagePixelator.ts",
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
    phase = "phase2-deferred2"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "User can add a lightweight local reminder",
        "Due reminder appears as pet speech",
        "Shown reminder is marked complete",
        "No OS/system notification or backend behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
