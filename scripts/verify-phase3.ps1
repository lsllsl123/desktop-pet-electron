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

Add-Check $checks "phase 2 deferred slice 5 checker report exists" (Test-Path "loop\reports\phase-2-deferred5-checker.json") "Phase 3 starts after accepted Phase 2 deferred slice 5."
Add-Check $checks "phase 3 maker prompt exists" (Test-Path "loop\prompts\maker-phase3.md") "Maker prompt must define authorized more-skins slice."
Add-Check $checks "phase 3 checker prompt exists" (Test-Path "loop\prompts\checker-phase3.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "pet skins module exists" (Test-Path "src\shared\petSkins.ts") "Expected deterministic shared built-in pet skin catalog."
Add-Check $checks "pet skins tests exist" (Test-Path "src\shared\petSkins.test.ts") "Expected tests for expanded skin catalog."
Add-Check $checks "phase 3 acceptance report exists" (Test-Path "loop\reports\phase-3-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\soundPacks.ts",
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated Phase 3 features."
}

if (Test-Path "src\shared\petSkins.ts") {
    $skinText = Get-Content -Raw "src\shared\petSkins.ts"
    Add-Check $checks "expanded skin catalog present" ($skinText -match "BUILT_IN_PET_SKINS" -and ([regex]::Matches($skinText, "id:").Count -gt 5)) "Expected more than five built-in skins."
    Add-Check $checks "skin metadata present" ($skinText -match "primaryColor" -and $skinText -match "accentColor" -and $skinText -match "textColor") "Expected visual color metadata."
} else {
    Add-Check $checks "expanded skin catalog present" $false "src\shared\petSkins.ts is missing."
    Add-Check $checks "skin metadata present" $false "src\shared\petSkins.ts is missing."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "renderer uses shared skin catalog" ($appText -match "BUILT_IN_PET_SKINS|getPetSkinByIndex|normalizePetSkinIndex") "Renderer should use shared skin catalog."
    Add-Check $checks "no forbidden UI added" (-not ($appText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|>Import<|>Export<|Hotkey|Plugin|Sound')) "This slice should not add file, import/export, hotkey, plugin, or sound UI."
} else {
    Add-Check $checks "renderer uses shared skin catalog" $false "src\App.tsx is missing."
    Add-Check $checks "no forbidden UI added" $false "src\App.tsx is missing."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main menu uses shared skin catalog" ($mainText -match "BUILT_IN_PET_SKINS|getPetSkinByIndex|normalizePetSkinIndex") "Main process character menu should use shared skin catalog."
} else {
    Add-Check $checks "main menu uses shared skin catalog" $false "src\main.ts is missing."
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
    phase = "phase3"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Right-click pet menu shows more than the original five built-in skins",
        "Selecting each added skin updates the visible pet label/color",
        "No sound, hotkey, plugin, import/export, upload, notification, backend, or cloud behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
