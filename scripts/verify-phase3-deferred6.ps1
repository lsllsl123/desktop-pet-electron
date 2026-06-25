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

Add-Check $checks "phase 3 deferred slice 5 checker report exists" (Test-Path "loop\reports\phase-3-deferred5-checker.json") "Action registry slice builds on accepted Phase 3 deferred slice 5."
Add-Check $checks "phase 3 deferred slice 6 maker prompt exists" (Test-Path "loop\prompts\maker-phase3-deferred6.md") "Maker prompt must define authorized built-in action registry slice."
Add-Check $checks "phase 3 deferred slice 6 checker prompt exists" (Test-Path "loop\prompts\checker-phase3-deferred6.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "pet actions module exists" (Test-Path "src\shared\petActions.ts") "Expected deterministic action registry helpers."
Add-Check $checks "pet actions tests exist" (Test-Path "src\shared\petActions.test.ts") "Expected action registry tests."
Add-Check $checks "phase 3 deferred slice 6 acceptance report exists" (Test-Path "loop\reports\phase-3-deferred6-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\externalPlugins.ts",
    "src\shared\pluginLoader.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated plugin/backend features."
}

if (Test-Path "src\shared\petActions.ts") {
    $actionText = Get-Content -Raw "src\shared\petActions.ts"
    Add-Check $checks "action catalog present" ($actionText -match "PET_ACTIONS" -and $actionText -match "toggle-window" -and $actionText -match "explode" -and $actionText -match "next-character") "Expected deterministic built-in action catalog."
    Add-Check $checks "action registry present" ($actionText -match "createPetActionRegistry" -and $actionText -match "dispatch" -and $actionText -match "handler") "Expected injected-handler action registry."
    Add-Check $checks "no dynamic plugin execution in action module" (-not ($actionText -cmatch "eval\s*\(|Function\s*\(|import\s*\(|require\s*\(|http|https|fetch\s*\(")) "Action registry must not load or execute external plugin code."
} else {
    Add-Check $checks "action catalog present" $false "src\shared\petActions.ts is missing."
    Add-Check $checks "action registry present" $false "src\shared\petActions.ts is missing."
    Add-Check $checks "no dynamic plugin execution in action module" $false "src\shared\petActions.ts is missing."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main integrates action registry" ($mainText -match "createPetActionRegistry" -and $mainText -match "petActionRegistry.dispatch") "Main process should route existing menu/hotkey actions through registry."
    Add-Check $checks "no forbidden plugin UI added" (-not ($mainText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|pluginLoader|externalPlugins|eval\s*\(|Function\s*\(|fetch\s*\(|Notification')) "This slice must not add external plugin loading, file UI, or notifications."
} else {
    Add-Check $checks "main integrates action registry" $false "src\main.ts is missing."
    Add-Check $checks "no forbidden plugin UI added" $false "src\main.ts is missing."
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
    phase = "phase3-deferred6"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Existing menu and hotkey actions still work through the built-in action registry",
        "Unknown or failed actions do not crash the app",
        "No external plugin loading, dynamic code execution, user scripts, backend, notification, upload, or cloud behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
