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

Add-Check $checks "phase 2 deferred slice 4 report exists" (Test-Path "loop\reports\phase-2-deferred4-acceptance.md") "Startup launch slice builds on accepted deferred slice 4."
Add-Check $checks "phase 2 deferred slice 5 maker prompt exists" (Test-Path "loop\prompts\maker-phase2-deferred5.md") "Maker prompt must define authorized startup launch setting slice."
Add-Check $checks "phase 2 deferred slice 5 checker prompt exists" (Test-Path "loop\prompts\checker-phase2-deferred5.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "startup launch module exists" (Test-Path "src\shared\startupLaunch.ts") "Expected testable startup launch controller."
Add-Check $checks "startup launch tests exist" (Test-Path "src\shared\startupLaunch.test.ts") "Expected tests for startup launch behavior."
Add-Check $checks "phase 2 deferred slice 5 acceptance report exists" (Test-Path "loop\reports\phase-2-deferred5-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated Phase 3 features."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main process startup integration present" ($mainText -match 'setLoginItemSettings|getLoginItemSettings|startup') "Expected minimal Electron main-process startup integration."
} else {
    Add-Check $checks "main process startup integration present" $false "src\main.ts is missing."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "no forbidden UI added" (-not ($appText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|>Import<|>Export<|Hotkey|Plugin|Sound')) "This slice should not add file, import/export, hotkey, plugin, or sound UI."
} else {
    Add-Check $checks "no forbidden UI added" $false "src\App.tsx is missing."
}

if (Test-Path "package.json") {
    $npmTest = Invoke-CommandCapture "npm test -- --runInBand"
    if ($npmTest.exitCode -ne 0) {
        $npmTest = Invoke-CommandCapture "npm test"
    }
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
    phase = "phase2-deferred5"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Launch-at-login can be enabled from the tray/menu setting",
        "Launch-at-login can be disabled from the tray/menu setting",
        "No hotkey, notification, backend, upload, sound, plugin, file upload, or import/export behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
