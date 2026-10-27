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
    $t = $e.payload_type
    $p = $e.payload
    $detail = ''
    if ($p) {
      foreach ($k in 'tool_name','name','command','path','file_path','text','message','content','status','reason','error') {
        if ($p.PSObject.Properties[$k] -and $p.$k) { $v = $p.$k.ToString(); $detail = "$k=" + $v.Substring(0, [Math]::Min(140, $v.Length)).Replace("`n", ' '); break }
      }
      if (-not $detail -and $p.input) { $v = ($p.input | ConvertTo-Json -Compress -Depth 3).ToString(); $detail = 'input=' + $v.Substring(0, [Math]::Min(140, $v.Length)) }
    }
    if ($t -notmatch 'heartbeat|token|delta|chunk') { Write-Host ("[{0}] {1} {2}" -f (Get-Date -Format HH:mm:ss), $t, $detail) }
  } catch { Write-Host $line }
}
