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
$SchemaPath = Join-Path $Root "loop\schemas\phase-result.schema.json"
$ReportsDir = Join-Path $Root "loop\reports"
$ReportPath = Join-Path $Root "loop\reports\phase-1-acceptance.md"

function Assert-RequiredFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "Required file missing: $Path"
    }
}

Assert-RequiredFile $StatePath
Assert-RequiredFile $ProgressPath
Assert-RequiredFile $ContractPath
Assert-RequiredFile $PhasePlanPath
Assert-RequiredFile $MakerPromptPath
Assert-RequiredFile $CheckerPromptPath
Assert-RequiredFile $SchemaPath

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

function Write-LoopReport {
    param(
        [string]$Name,
        [string]$Content
    )
    if (-not (Test-Path $ReportsDir)) {
        New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
    }
    Set-Content -Path (Join-Path $ReportsDir $Name) -Value $Content -Encoding UTF8
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

function ConvertFrom-JsonObjectText {
    param([string]$Text)

    try {
        return $Text | ConvertFrom-Json
    } catch {
        $candidate = $Text
    }

    if ($candidate -match '(?s)```(?:json)?\s*(\{.*?\})\s*```') {
        return $Matches[1] | ConvertFrom-Json
    }

    $start = $candidate.IndexOf("{")
    $end = $candidate.LastIndexOf("}")
    if ($start -ge 0 -and $end -gt $start) {
        return $candidate.Substring($start, $end - $start + 1) | ConvertFrom-Json
    }

    throw "No parseable JSON object found."
}

function Invoke-ClaudeJson {
    param(
        [string]$Prompt,
        [string]$SystemPrompt,
        [string]$AllowedTools,
        [string]$PermissionMode,
        [double]$BudgetUsd,
        [string]$JsonSchemaPath = $null
    )

    $claudeArgs = @(
        "-p",
        "--output-format",
        "json",
        "--allowedTools",
        $AllowedTools,
        "--permission-mode",
        $PermissionMode,
        "--max-budget-usd",
        [string]$BudgetUsd,
        "--append-system-prompt",
        $SystemPrompt
    )

    if (-not [string]::IsNullOrWhiteSpace($JsonSchemaPath)) {
        $claudeArgs += @(
            "--json-schema",
            (Get-Content -Raw $JsonSchemaPath)
        )
    }

    $raw = $Prompt | & cmd /c claude @claudeArgs 2>&1
    $exit = $LASTEXITCODE

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
        $json = ConvertFrom-JsonObjectText $text
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
Read these files and return only one raw JSON object matching loop/schemas/phase-result.schema.json. Do not wrap the JSON in Markdown fences and do not add commentary:

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

if ($DryRun) {
    if ($Phase -ne "phase1") {
        Append-Progress "- Phase: $Phase`n- DryRun: phase is not authorized yet; skipped state mutation and Claude calls."
        Write-Output "Phase $Phase requires human approval."
        exit 1
    }

    Append-Progress "- Phase: $Phase`n- DryRun: runner loaded state and skipped Claude calls."
    Write-Output "DryRun complete."
    exit 0
}

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

while ($state.iteration -lt $MaxIterations -and $state.spentUsd -lt $MaxBudgetUsd) {
    $state.iteration = [int]$state.iteration + 1
    $state.status = "running"
    $state.lastUpdated = (Get-Date).ToString("o")
    Write-JsonFile $StatePath $state

    $verificationBefore = Invoke-Verification
    $iterationPrefix = "$Phase-iteration-$($state.iteration)"
    Write-LoopReport "$iterationPrefix-verification-before.json" $verificationBefore.output

    $makerPrompt = New-MakerPrompt $state $verificationBefore.output
    $maker = Invoke-ClaudeJson `
        -Prompt $makerPrompt `
        -SystemPrompt "You are the maker. You do not declare done; checker decides." `
        -AllowedTools "Read,Edit,Bash" `
        -PermissionMode "acceptEdits" `
        -BudgetUsd 2

    $state.spentUsd = [double]$state.spentUsd + [double]$maker.cost
    Write-LoopReport "$iterationPrefix-maker-raw.json" $maker.raw
    Write-JsonFile $StatePath $state

    $verificationAfter = Invoke-Verification
    Write-LoopReport "$iterationPrefix-verification-after.json" $verificationAfter.output

    $checkerPrompt = New-CheckerPrompt $state $maker.result $verificationAfter.output
    $checker = Invoke-ClaudeJson `
        -Prompt $checkerPrompt `
        -SystemPrompt "You are the checker. Default to reject unless evidence proves the phase goal." `
        -AllowedTools "Read,Bash" `
        -PermissionMode "plan" `
        -BudgetUsd 1 `
        -JsonSchemaPath $SchemaPath

    $state.spentUsd = [double]$state.spentUsd + [double]$checker.cost
    Write-LoopReport "$iterationPrefix-checker-raw.json" $checker.raw

    try {
        $verdict = ConvertFrom-JsonObjectText $checker.result
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
