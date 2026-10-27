# Visible belt dispatch for the founder's terminal. Loads MODEL_API_KEY from .env into THIS process only (never printed),
# then runs the controller dispatch. Usage:
#   & D:\nova\fb-ai-hackathon\tools\belt\run-dispatch.ps1 -Stage 02.dossier_sections -Section sec09-rules-of-the-road -Approval runs\...\approvals\GO-....json -ApprovalSha <sha> [-Go]
param(
  [Parameter(Mandatory=$true)][string]$Stage,
  [Parameter(Mandatory=$true)][string]$Section,
  [Parameter(Mandatory=$true)][string]$Approval,
  [Parameter(Mandatory=$true)][string]$ApprovalSha,
  [string]$RunConfig = 'runs\2026-10-26-rdmv-ut-class-d\run-config.json',
  [string]$ExecutorId = '2bdcad95-d4cc-467e-a88d-be4a6260cf03',
  [switch]$Go
)
$ErrorActionPreference = 'Stop'
Set-Location 'D:\nova\fb-ai-hackathon'
$line = Get-Content .env | Where-Object { $_ -match '^MODEL_API_KEY=' } | Select-Object -First 1
if (-not $line) { Write-Error 'MODEL_API_KEY not found in .env'; exit 1 }
$env:MODEL_API_KEY = $line.Substring('MODEL_API_KEY='.Length).Trim()
Write-Host ("key loaded: " + ($env:MODEL_API_KEY.StartsWith('LLM_')) + "  mode: " + $(if ($Go) { 'LIVE (--go)' } else { 'dry envelope' }))
$args = @('tools\belt\controller.mjs','dispatch','--run-config',$RunConfig,'--executor-id',$ExecutorId,'--stage',$Stage,'--section',$Section,'--approval',$Approval,'--approval-sha256',$ApprovalSha)
if ($Go) { $args += '--go' }
& node --no-warnings @args
