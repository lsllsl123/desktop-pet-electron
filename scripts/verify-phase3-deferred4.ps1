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

Add-Check $checks "phase 3 deferred slice 3 checker report exists" (Test-Path "loop\reports\phase-3-deferred3-checker.json") "Import/export slice builds on accepted Phase 3 deferred slice 3."
Add-Check $checks "phase 3 deferred slice 4 maker prompt exists" (Test-Path "loop\prompts\maker-phase3-deferred4.md") "Maker prompt must define authorized import/export slice."
Add-Check $checks "phase 3 deferred slice 4 checker prompt exists" (Test-Path "loop\prompts\checker-phase3-deferred4.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "custom character transfer module exists" (Test-Path "src\shared\customCharacterTransfer.ts") "Expected deterministic transfer helpers."
Add-Check $checks "custom character transfer tests exist" (Test-Path "src\shared\customCharacterTransfer.test.ts") "Expected transfer tests."
Add-Check $checks "phase 3 deferred slice 4 acceptance report exists" (Test-Path "loop\reports\phase-3-deferred4-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated Phase 3 features."
}

if (Test-Path "src\shared\customCharacterTransfer.ts") {
    $transferText = Get-Content -Raw "src\shared\customCharacterTransfer.ts"
    Add-Check $checks "versioned transfer format present" ($transferText -match "CUSTOM_CHARACTER_EXPORT_VERSION" -and $transferText -match "version") "Expected versioned package format."
    Add-Check $checks "import export helpers present" ($transferText -match "exportCustomCharactersPackage" -and $transferText -match "importCustomCharactersPackage" -and $transferText -match "mergeImportedCustomCharacters") "Expected export, import, and merge helpers."
} else {
    Add-Check $checks "versioned transfer format present" $false "src\shared\customCharacterTransfer.ts is missing."
    Add-Check $checks "import export helpers present" $false "src\shared\customCharacterTransfer.ts is missing."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "renderer exposes text import export" ($appText -match "exportCustomCharactersPackage" -and $appText -match "importCustomCharactersPackage" -and $appText -match "textarea") "Renderer should expose local text copy/paste import/export."
    Add-Check $checks "no forbidden file UI added" (-not ($appText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|Hotkey|Plugin')) "This slice must not add file upload/native dialog/hotkey/plugin UI."
} else {
    Add-Check $checks "renderer exposes text import export" $false "src\App.tsx is missing."
    Add-Check $checks "no forbidden file UI added" $false "src\App.tsx is missing."
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
    phase = "phase3-deferred4"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Renderer exposes local text copy/paste import/export for custom characters",
        "Exported custom character JSON can be pasted back and imported without duplicates",
        "No native file dialog, file upload, hotkey, plugin, backend, notification, upload, or cloud behavior is present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
