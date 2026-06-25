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

Add-Check $checks "package.json exists" (Test-Path "package.json") "Phase 1 implementation must create package.json."
Add-Check $checks "electron main entry exists" ((Test-Path "src\main") -or (Test-Path "electron") -or (Test-Path "src\main.ts")) "Expected Electron main process entry."
Add-Check $checks "renderer entry exists" ((Test-Path "src\renderer") -or (Test-Path "src\App.tsx") -or (Test-Path "src\renderer.tsx")) "Expected renderer entry."
Add-Check $checks "state machine module exists" ((Test-Path "src\shared\animationStateMachine.ts") -or (Test-Path "src\renderer\animationStateMachine.ts")) "Expected animation state machine module."
Add-Check $checks "explosion engine module exists" ((Test-Path "src\renderer\explosionEngine.ts") -or (Test-Path "src\renderer\effects\explosionEngine.ts")) "Expected Canvas explosion engine module."
Add-Check $checks "settings store module exists" ((Test-Path "src\main\settingsStore.ts") -or (Test-Path "src\shared\settingsStore.ts")) "Expected local settings persistence module."

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
    phase = "phase1"
    passed = ($failed.Count -eq 0)
    generatedAt = (Get-Date).ToString("o")
    checks = $checks
    manualVerificationRequired = @(
        "Transparent frameless desktop window appears",
        "Desktop pet can be dragged with pointer",
        "Right-click menu opens on the pet",
        "Explosion animation visually plays and recovers",
        "Tray show/hide/quit works in Windows shell"
    )
}

$json = $result | ConvertTo-Json -Depth 8
Write-Output $json

if ($failed.Count -gt 0) {
    exit 1
}

exit 0
