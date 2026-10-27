# launch-muse.ps1 — run one Muse Code launch with live JSON events in the terminal and a JSONL transcript on disk.
#   powershell -File coordination\launch-muse.ps1 -Brief coordination\MUSE-AUDIO-PLAYBACK-BRIEF.md -Tag playback
param(
  [Parameter(Mandatory = $true)][string]$Brief,
  [Parameter(Mandatory = $true)][string]$Tag
)
Set-Location D:\nova\fb-ai-hackathon
$log = "D:\nova\fb-ai-hackathon\coordination\muse-launch-$Tag.jsonl"
& "C:\Users\varad\AppData\Local\Programs\muse\muse.cmd" exec --prompt-file $Brief --model muse-spark-1.3 --contributor-mode off --trust-workspace --approval-mode never --sandbox-network enabled --workspace D:\nova\fb-ai-hackathon --json 2>&1 | ForEach-Object {
  $line = $_.ToString()
  Add-Content -Path $log -Value $line -Encoding utf8
  try {
    $e = $line | ConvertFrom-Json
    $t = $e.type; if (-not $t) { $t = $e.event }
    $s = ($line.Length)
    if ($e.tool) { Write-Host ("[{0}] {1} {2}" -f (Get-Date -Format HH:mm:ss), $t, $e.tool) }
    elseif ($e.text) { Write-Host ("[{0}] {1}: {2}" -f (Get-Date -Format HH:mm:ss), $t, ($e.text.ToString().Substring(0, [Math]::Min(160, $e.text.ToString().Length)))) }
    else { Write-Host ("[{0}] {1} ({2} bytes)" -f (Get-Date -Format HH:mm:ss), $t, $s) }
  } catch { Write-Host $line }
}
