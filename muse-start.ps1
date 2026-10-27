# Launch Muse Code for the hackathon lane with the pinned safety/model flags.
# Usage (any PowerShell):  & D:\nova\fb-ai-hackathon\muse-start.ps1
# - workspace = this folder only → OS sandbox confines writes here; the rest of D:\nova stays read-only
# - standard model, contributor mode OFF (Meta must not train on Nova/DL-7-derived content)
# - approval: on-request (default) with the Auto-review judge; sandbox ON; network proxy-only
#   (approve api.meta.ai and dps.texas.gov once with "Always allow in this workspace")
$muse = Join-Path $env:LOCALAPPDATA 'Programs\muse\muse.cmd'
if (-not (Test-Path $muse)) { Write-Error "muse not installed at $muse"; exit 1 }
& $muse --workspace 'D:\nova\fb-ai-hackathon' --model 'muse-spark-1.3' --contributor-mode off --approval-mode on-request --sandbox-network proxy-only @args
