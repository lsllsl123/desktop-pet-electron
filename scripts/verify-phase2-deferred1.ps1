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

Add-Check $checks "phase 2 foundation report exists" (Test-Path "loop\reports\phase-2-acceptance.md") "Deferred slice 1 builds on accepted Phase 2 foundation."
Add-Check $checks "phase 2 deferred slice 1 maker prompt exists" (Test-Path "loop\prompts\maker-phase2-deferred1.md") "Maker prompt must define authorized slice."
Add-Check $checks "phase 2 deferred slice 1 checker prompt exists" (Test-Path "loop\prompts\checker-phase2-deferred1.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "deferred behavior module exists" (Test-Path "src\shared\deferredPetBehavior.ts") "Expected deterministic sleeping, cursor peeking, edge nudge, and drag dizziness module."
Add-Check $checks "deferred behavior tests exist" (Test-Path "src\shared\deferredPetBehavior.test.ts") "Expected tests for the deterministic behavior module."
Add-Check $checks "phase 2 deferred slice 1 acceptance report exists" (Test-Path "loop\reports\phase-2-deferred1-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\todoStore.ts",
    "src\shared\imagePixelator.ts",
    "src\shared\customCharacterManager.ts",
    "src\shared\startupLaunch.ts",
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts"
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
    phase = "phase2-deferred1"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Pet visibly sleeps after idle threshold",
        "Pet peeks toward cursor when cursor is nearby",
        "Pet nudges away from screen edges",
        "Pet shows drag dizziness after fast or long drag"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
