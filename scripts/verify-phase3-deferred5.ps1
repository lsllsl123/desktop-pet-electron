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

Add-Check $checks "phase 3 deferred slice 4 checker report exists" (Test-Path "loop\reports\phase-3-deferred4-checker.json") "Hotkeys slice builds on accepted Phase 3 deferred slice 4."
Add-Check $checks "phase 3 deferred slice 5 maker prompt exists" (Test-Path "loop\prompts\maker-phase3-deferred5.md") "Maker prompt must define authorized hotkeys slice."
Add-Check $checks "phase 3 deferred slice 5 checker prompt exists" (Test-Path "loop\prompts\checker-phase3-deferred5.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "hotkeys module exists" (Test-Path "src\shared\hotkeys.ts") "Expected deterministic hotkey helpers."
Add-Check $checks "hotkeys tests exist" (Test-Path "src\shared\hotkeys.test.ts") "Expected hotkey controller tests."
Add-Check $checks "phase 3 deferred slice 5 acceptance report exists" (Test-Path "loop\reports\phase-3-deferred5-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated Phase 3 features."
}

if (Test-Path "src\shared\hotkeys.ts") {
    $hotkeysText = Get-Content -Raw "src\shared\hotkeys.ts"
    Add-Check $checks "hotkey catalog present" ($hotkeysText -match "HOTKEYS" -and $hotkeysText -match "accelerator" -and $hotkeysText -match "action") "Expected deterministic fixed hotkey catalog."
    Add-Check $checks "hotkey controller present" ($hotkeysText -match "createHotkeyController" -and $hotkeysText -match "register" -and $hotkeysText -match "unregister") "Expected injected-adapter hotkey controller."
} else {
    Add-Check $checks "hotkey catalog present" $false "src\shared\hotkeys.ts is missing."
    Add-Check $checks "hotkey controller present" $false "src\shared\hotkeys.ts is missing."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main integrates hotkeys" ($mainText -match "globalShortcut" -and $mainText -match "createHotkeyController" -and $mainText -match "send") "Main process should register fixed hotkeys and trigger existing pet events."
    Add-Check $checks "no forbidden dynamic hotkey or plugin UI added" (-not ($mainText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|Plugin|pluginActions|Notification')) "This slice must not add file UI, plugin system, or notifications."
} else {
    Add-Check $checks "main integrates hotkeys" $false "src\main.ts is missing."
    Add-Check $checks "no forbidden dynamic hotkey or plugin UI added" $false "src\main.ts is missing."
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
    phase = "phase3-deferred5"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Configured fixed hotkeys trigger existing pet actions",
        "Hotkeys are registered only while the app is running and are unregistered on quit",
        "No user-editable hotkey UI, plugin, backend, notification, upload, or cloud behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
