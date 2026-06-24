param(
    [ValidateSet("phase1","phase2","phase3")]
    [string]$Phase = "phase1",
    [int]$MaxIterations = 6,
    [double]$MaxBudgetUsd = 8,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path ".").Path
$StatePath = Join-Path $Root "loop\phase-state.json"
$ProgressPath = Join-Path $Root "loop\LOOP_PROGRESS.md"
$ContractPath = Join-Path $Root "docs\loop-engineering\loop-contract.md"
$PhasePlanPath = Join-Path $Root "docs\loop-engineering\phase-plan.md"
$MakerPromptPath = Join-Path $Root "loop\prompts\maker-$Phase.md"
$CheckerPromptPath = Join-Path $Root "loop\prompts\checker-$Phase.md"
$ReportPath = Join-Path $Root "loop\reports\phase-1-acceptance.md"

function Read-JsonFile {
    param([string]$Path)
    return Get-Content -Raw $Path | ConvertFrom-Json
}

function Write-JsonFile {
    param(
        [string]$Path,
        [object]$Value
    )
    $Value | ConvertTo-Json -Depth 12 | Set-Content -Path $Path -Encoding UTF8
}

function Append-Progress {
    param([string]$Text)
    Add-Content -Path $ProgressPath -Value ""
    Add-Content -Path $ProgressPath -Value "## $(Get-Date -Format o)"
    Add-Content -Path $ProgressPath -Value $Text
}

function Get-FailureSignature {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }
    $normalized = ($Text -replace "\s+", " ").Trim()
    if ($normalized.Length -gt 240) {
        return $normalized.Substring(0, 240)
    }
    return $normalized
}

function Invoke-ClaudeJson {
    param(
        [string]$Prompt,
        [string]$SystemPrompt,
        [string]$AllowedTools,
        [string]$PermissionMode,
        [double]$BudgetUsd
    )

    $promptFile = New-TemporaryFile
    Set-Content -Path $promptFile -Value $Prompt -Encoding UTF8

    $command = 'claude -p "' + (Get-Content -Raw $promptFile.FullName).Replace('"','\"') + '" --output-format json --allowedTools "' + $AllowedTools + '" --permission-mode ' + $PermissionMode + ' --max-budget-usd ' + $BudgetUsd + ' --append-system-prompt "' + $SystemPrompt.Replace('"','\"') + '"'
    $raw = & cmd /c $command 2>&1
    $exit = $LASTEXITCODE
    Remove-Item $promptFile -Force

    $text = ($raw -join "`n")
    if ($exit -ne 0) {
        return [pscustomobject]@{
            ok = $false
            cost = 0
            result = $text
            raw = $text
        }
    }

    try {
        $json = $text | ConvertFrom-Json
        return [pscustomobject]@{
            ok = $true
            cost = [double]($json.total_cost_usd)
            result = [string]($json.result)
            raw = $text
        }
    } catch {
        return [pscustomobject]@{
            ok = $false
            cost = 0
            result = $text
            raw = $text
        }
    }
}

function Invoke-Verification {
    if ($Phase -ne "phase1") {
        return [pscustomobject]@{
            exitCode = 1
            output = '{"passed":false,"checks":[{"name":"phase authorization","passed":false,"details":"Only phase1 is authorized."}]}'
        }
    }

    $output = & powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\verify-phase1.ps1" 2>&1
    return [pscustomobject]@{
        exitCode = $LASTEXITCODE
        output = ($output -join "`n")
    }
}

function New-MakerPrompt {
    param([object]$State, [string]$VerificationOutput)
    return @"
Read these files and follow them exactly:

$ContractPath
$PhasePlanPath
$MakerPromptPath
$ProgressPath
$StatePath

Latest verification output:

$VerificationOutput

Implement the smallest verifiable Phase 1 change. Do not implement Phase 2.
"@
}

function New-CheckerPrompt {
    param(
        [object]$State,
        [string]$MakerResult,
        [string]$VerificationOutput
    )
    return @"
Read these files and return only JSON matching loop/schemas/phase-result.schema.json:

$ContractPath
$PhasePlanPath
$CheckerPromptPath
$ProgressPath
$StatePath

Maker result:

$MakerResult

Verification output:

$VerificationOutput

Inspect the current repository state and git diff. Decide PASS, FAIL, or ESCALATE.
"@
}

if (-not (Test-Path $StatePath)) {
    throw "Missing state file: $StatePath"
}

$state = Read-JsonFile $StatePath
$state.phase = $Phase
$state.maxIterations = $MaxIterations
$state.maxBudgetUsd = $MaxBudgetUsd

if ($state.status -eq "goal_met") {
    Append-Progress "- Phase: $Phase`n- Stop: already goal_met"
    Write-Output "Phase $Phase already goal_met."
    exit 0
}

if ($Phase -ne "phase1") {
    $state.status = "needs_human"
    $state.stopReason = "needs_human"
    $state.requiresHumanApproval = $true
    $state.lastUpdated = (Get-Date).ToString("o")
    Write-JsonFile $StatePath $state
    Append-Progress "- Phase: $Phase`n- Stop: Phase is not authorized yet."
    Write-Output "Phase $Phase requires human approval."
    exit 1
}

if ($DryRun) {
    Append-Progress "- Phase: $Phase`n- DryRun: runner loaded state and skipped Claude calls."
    Write-Output "DryRun complete."
    exit 0
}

while ($state.iteration -lt $MaxIterations -and $state.spentUsd -lt $MaxBudgetUsd) {
    $state.iteration = [int]$state.iteration + 1
    $state.status = "running"
    $state.lastUpdated = (Get-Date).ToString("o")
    Write-JsonFile $StatePath $state

    $verificationBefore = Invoke-Verification
    $makerPrompt = New-MakerPrompt $state $verificationBefore.output
    $maker = Invoke-ClaudeJson `
        -Prompt $makerPrompt `
        -SystemPrompt "You are the maker. You do not declare done; checker decides." `
        -AllowedTools "Read,Edit,Bash" `
        -PermissionMode "acceptEdits" `
        -BudgetUsd 2

    $state.spentUsd = [double]$state.spentUsd + [double]$maker.cost
    Write-JsonFile $StatePath $state

    $verificationAfter = Invoke-Verification
    $checkerPrompt = New-CheckerPrompt $state $maker.result $verificationAfter.output
    $checker = Invoke-ClaudeJson `
        -Prompt $checkerPrompt `
        -SystemPrompt "You are the checker. Default to reject unless evidence proves the phase goal." `
        -AllowedTools "Read,Bash" `
        -PermissionMode "plan" `
        -BudgetUsd 1

    $state.spentUsd = [double]$state.spentUsd + [double]$checker.cost

    try {
        $verdict = $checker.result | ConvertFrom-Json
    } catch {
        $verdict = [pscustomobject]@{
            verdict = "ESCALATE"
            stop_reason = "needs_human"
            summary = "Checker did not return parseable JSON."
            blocking_issues = @($checker.result)
            next_maker_instruction = ""
        }
    }

    $signatureSource = (($verdict.blocking_issues | Out-String) + "`n" + $verificationAfter.output)
    $signature = Get-FailureSignature $signatureSource

    if ($null -ne $signature -and $signature -eq $state.lastFailureSignature) {
        $state.repeatFailureCount = [int]$state.repeatFailureCount + 1
    } else {
        $state.lastFailureSignature = $signature
        $state.repeatFailureCount = 1
    }

    Append-Progress "- Phase: $Phase`n- Iteration: $($state.iteration)`n- Maker cost: $($maker.cost)`n- Checker cost: $($checker.cost)`n- Checker verdict: $($verdict.verdict)`n- Summary: $($verdict.summary)"

    if ($verdict.verdict -eq "PASS") {
        $state.status = "goal_met"
        $state.stopReason = "goal_met"
        $state.requiresHumanApproval = $true
        $state.lastUpdated = (Get-Date).ToString("o")
        Write-JsonFile $StatePath $state

        Set-Content -Path $ReportPath -Encoding UTF8 -Value @"
# Phase 1 Acceptance Report

- Status: goal_met
- Generated: $($state.lastUpdated)
- Iterations: $($state.iteration)
- Spent USD: $($state.spentUsd)

## Checker Summary

$($verdict.summary)

## Manual Verification Required

$($verdict.manual_verification_required -join "`n")
"@
        Write-Output "Phase $Phase goal_met. Human approval required."
        exit 0
    }

    if ($verdict.verdict -eq "ESCALATE") {
        $state.status = "needs_human"
        $state.stopReason = "needs_human"
        $state.requiresHumanApproval = $true
        $state.lastUpdated = (Get-Date).ToString("o")
        Write-JsonFile $StatePath $state
        Write-Output "Phase $Phase needs_human."
        exit 1
    }

    if ($state.repeatFailureCount -ge 2) {
        $state.status = "stalled"
        $state.stopReason = "stalled"
        $state.requiresHumanApproval = $true
        $state.lastUpdated = (Get-Date).ToString("o")
        Write-JsonFile $StatePath $state
        Write-Output "Phase $Phase stalled."
        exit 1
    }

    Write-JsonFile $StatePath $state
}

$state.status = "budget_spent"
$state.stopReason = "budget_spent"
$state.requiresHumanApproval = $true
$state.lastUpdated = (Get-Date).ToString("o")
Write-JsonFile $StatePath $state
Append-Progress "- Phase: $Phase`n- Stop: budget_spent"
Write-Output "Phase $Phase budget_spent."
exit 1
