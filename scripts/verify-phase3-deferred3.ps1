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

Add-Check $checks "phase 3 deferred slice 2 checker report exists" (Test-Path "loop\reports\phase-3-deferred2-checker.json") "Sound packs slice builds on accepted Phase 3 deferred slice 2."
Add-Check $checks "phase 3 deferred slice 3 maker prompt exists" (Test-Path "loop\prompts\maker-phase3-deferred3.md") "Maker prompt must define authorized sound packs slice."
Add-Check $checks "phase 3 deferred slice 3 checker prompt exists" (Test-Path "loop\prompts\checker-phase3-deferred3.md") "Checker prompt must define acceptance criteria."
Add-Check $checks "sound packs module exists" (Test-Path "src\shared\soundPacks.ts") "Expected deterministic sound pack catalog."
Add-Check $checks "sound packs tests exist" (Test-Path "src\shared\soundPacks.test.ts") "Expected tests for sound packs."
Add-Check $checks "sound player adapter exists" (Test-Path "src\renderer\soundPlayer.ts") "Expected minimal local synthesized tone adapter."
Add-Check $checks "phase 3 deferred slice 3 acceptance report exists" (Test-Path "loop\reports\phase-3-deferred3-acceptance.md") "Slice must write an acceptance report."

$forbiddenPaths = @(
    "src\shared\hotkeys.ts",
    "src\shared\pluginActions.ts",
    "src\main\backend.ts",
    "src\main\notifications.ts"
)

foreach ($path in $forbiddenPaths) {
    Add-Check $checks "forbidden feature absent: $path" (-not (Test-Path $path)) "This slice must not implement unrelated Phase 3 features."
}

$audioFiles = @(Get-ChildItem -Recurse -File -Include *.mp3,*.wav,*.ogg,*.flac,*.m4a -ErrorAction SilentlyContinue)
Add-Check $checks "no external audio files added" ($audioFiles.Count -eq 0) "This slice must synthesize tones locally instead of adding audio assets."

if (Test-Path "src\shared\soundPacks.ts") {
    $soundText = Get-Content -Raw "src\shared\soundPacks.ts"
    Add-Check $checks "expanded sound pack catalog present" ($soundText -match "BUILT_IN_SOUND_PACKS" -and ([regex]::Matches($soundText, "id:").Count -gt 1)) "Expected more than one sound pack."
    Add-Check $checks "event tone metadata present" ($soundText -match "frequencyHz" -and $soundText -match "durationMs" -and $soundText -match "gain" -and $soundText -match "resolveSoundCommand") "Expected event-to-tone metadata and resolver."
} else {
    Add-Check $checks "expanded sound pack catalog present" $false "src\shared\soundPacks.ts is missing."
    Add-Check $checks "event tone metadata present" $false "src\shared\soundPacks.ts is missing."
}

if (Test-Path "src\renderer\soundPlayer.ts") {
    $playerText = Get-Content -Raw "src\renderer\soundPlayer.ts"
    Add-Check $checks "web audio adapter present" ($playerText -match "AudioContext|OscillatorNode|createOscillator|createGain") "Expected minimal WebAudio synthesized tone adapter."
} else {
    Add-Check $checks "web audio adapter present" $false "src\renderer\soundPlayer.ts is missing."
}

if (Test-Path "src\App.tsx") {
    $appText = Get-Content -Raw "src\App.tsx"
    Add-Check $checks "renderer uses selected sound pack" ($appText -match "resolveSoundCommand" -and $appText -match "playSoundCommand|createSoundPlayer|soundPack") "Renderer should resolve and play synthesized tones from selected pack."
    Add-Check $checks "no forbidden UI added" (-not ($appText -cmatch 'type\s*=\s*["'']file["'']|showOpenDialog|FileReader|>Import<|>Export<|Hotkey|Plugin')) "This slice should not add file, import/export, hotkey, or plugin UI."
} else {
    Add-Check $checks "renderer uses selected sound pack" $false "src\App.tsx is missing."
    Add-Check $checks "no forbidden UI added" $false "src\App.tsx is missing."
}

if (Test-Path "src\main.ts") {
    $mainText = Get-Content -Raw "src\main.ts"
    Add-Check $checks "main menu exposes sound packs" ($mainText -match "BUILT_IN_SOUND_PACKS" -and $mainText -match "menu:setSoundPack") "Main process context menu should expose sound pack choices."
} else {
    Add-Check $checks "main menu exposes sound packs" $false "src\main.ts is missing."
}

if (Test-Path "src\preload.ts") {
    $preloadText = Get-Content -Raw "src\preload.ts"
    Add-Check $checks "preload forwards sound pack id" ($preloadText -match "onSetSoundPack" -and $preloadText -match "packId") "Preload should forward selected sound pack id."
} else {
    Add-Check $checks "preload forwards sound pack id" $false "src\preload.ts is missing."
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
    phase = "phase3-deferred3"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Right-click pet menu shows sound pack choices",
        "Selecting Blip or Chime makes click, switch, explosion, or reminder events produce synthesized sound",
        "Selecting Mute disables synthesized sounds",
        "No hotkey, plugin, import/export, upload, notification, backend, cloud behavior, or external audio files are present"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
