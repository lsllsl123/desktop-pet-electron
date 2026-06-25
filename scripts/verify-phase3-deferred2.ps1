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

Add-Check $checks "phase 3 slice 1 checker report exists" (Test-Path "loop\reports\phase-3-checker.json") "Explosion styles slice builds on accepted Phase 3 Slice 1."
Add-Check $checks "phase 3 deferred slice 2 maker prompt exists" (Test-Path "loop\prompts\maker-phase3-deferred2.md") "Maker prompt must define authorized explosion styles slice."
Add-Check $checks "phase 3 deferred slice 2 checker prompt exists" (Test-Path "loop\prompts\checker-phase3-deferred2.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "explosion styles module exists" (Test-Path "src\renderer\explosionStyles.ts") "Expected deterministic explosion style catalog."
Add-Check $checks "explosion styles tests exist" (Test-Path "src\renderer\explosionStyles.test.ts") "Expected tests for explosion styles."
Add-Check $checks "phase 3 deferred slice 2 acceptance report exists" (Test-Path "loop\reports\phase-3-deferred2-acceptance.md") "Slice must write an acceptance report."

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

if (Test-Path "src\renderer\explosionStyles.ts") {
    $styleText = Get-Content -Raw "src\renderer\explosionStyles.ts"
    Add-Check $checks "expanded explosion style catalog present" ($styleText -match "EXPLOSION_STYLES" -and ([regex]::Matches($styleText, "id:").Count -gt 1)) "Expected more than one explosion style."
    Add-Check $checks "explosion config metadata present" ($styleText -match "count" -and $styleText -match "speed" -and $styleText -match "lifetime" -and $styleText -match "hueStart" -and $styleText -match "hueEnd") "Expected particle config metadata."
} else {
    Add-Check $checks "expanded explosion style catalog present" $false "src\renderer\explosionStyles.ts is missing."
    Add-Check $checks "explosion config metadata present" $false "src\renderer\explosionStyles.ts is missing."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "renderer uses explosion styles" ($appText -match "resolveExplosionConfig|getExplosionStyleById|ExplosionStyleId") "Renderer should resolve explosion config from style id."
    Add-Check $checks "no forbidden UI added" (-not ($appText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|>Import<|>Export<|Hotkey|Plugin|Sound')) "This slice should not add file, import/export, hotkey, plugin, or sound UI."
} else {
    Add-Check $checks "renderer uses explosion styles" $false "src\App.tsx is missing."
    Add-Check $checks "no forbidden UI added" $false "src\App.tsx is missing."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main menu exposes explosion styles" ($mainText -match "EXPLOSION_STYLES" -and $mainText -match "menu:explode") "Main process context menu should expose explosion style choices."
} else {
    Add-Check $checks "main menu exposes explosion styles" $false "src\main.ts is missing."
}

if (Test-Path "src\preload.ts") {
    $preloadText = Get-Content -Raw "src\preload.ts"
    Add-Check $checks "preload forwards explosion style id" ($preloadText -match "onExplode" -and $preloadText -match "styleId") "Preload should forward selected explosion style id."
} else {
    Add-Check $checks "preload forwards explosion style id" $false "src\preload.ts is missing."
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
    phase = "phase3-deferred2"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Right-click pet menu shows at least two explosion style choices",
        "Selecting different explosion style choices produces visibly different particle bursts",
        "No sound, hotkey, plugin, import/export, upload, notification, backend, or cloud behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
