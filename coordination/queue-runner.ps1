# queue-runner.ps1 — keep up to $MaxParallel Muse intake+SME launches running; when one finishes, start the next staged state.
# Founder 2026-10-28: "treat this like queue: when one completes fill it with next pdf of next state".
#   powershell -NoProfile -ExecutionPolicy Bypass -File coordination\queue-runner.ps1 [-MaxParallel 5] [-Order "AZ,WA,NC,..."]
# Staged = runs\_intake\sources\private\<ST>.pdf exists. Finished = newest coordination\muse-launch-intake-<ST>*.jsonl has a
# run.terminal event (or no launch yet). Complete = coordination\MUSE-INTAKE-<ST>-REPORT.md exists. A finished, incomplete
# state is relaunched (max 3 relaunches). A 429 "quota exhausted ... resets at <time>" pauses ALL launches until that time.
# Launches run as child processes of this runner (no terminal tab); live events stream to their JSONL files.
param(
  [int]$MaxParallel = 5,
  [string]$Order = "",
  [int]$PollSeconds = 60,
  [switch]$NoNew
)
Set-Location D:\nova\fb-ai-hackathon
$lane = "D:\nova\fb-ai-hackathon"
$staging = Join-Path $lane "runs\_intake\sources\private"
$brief = Join-Path $lane "coordination\MUSE-STATE-INTAKE-BRIEF.md"
$launcher = Join-Path $lane "coordination\launch-muse.ps1"
$stateLog = Join-Path $lane "coordination\QUEUE-RUNNER.log"
$stateFile = Join-Path $lane "coordination\QUEUE-RUNNER.state.json"
$skip = @("UT")
$script:pauseUntil = Get-Date "2000-01-01"
$relaunches = @{}
if (Test-Path $stateFile) { try { $saved = Get-Content -Raw $stateFile | ConvertFrom-Json; foreach ($p in $saved.relaunches.PSObject.Properties) { $relaunches[$p.Name] = [int]$p.Value }; if ($saved.pause_until) { $script:pauseUntil = [DateTime]::Parse($saved.pause_until) } } catch {} }

function Log($msg) { $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg; Write-Host $line; Add-Content -Path $stateLog -Value $line -Encoding utf8 }
function SaveState() { @{ relaunches = $relaunches; pause_until = $script:pauseUntil.ToString("o"); saved_at = (Get-Date).ToString("o") } | ConvertTo-Json | Set-Content -Path $stateFile -Encoding utf8 }
function Staged() {
  $pdfs = @(Get-ChildItem -Path $staging -Filter "*.pdf" -ErrorAction SilentlyContinue | Where-Object { $_.BaseName -match '^[A-Z]{2}$' } | ForEach-Object { $_.BaseName })
  if ($Order) { $ordered = @(); foreach ($s in ($Order -split ",")) { $s = $s.Trim().ToUpper(); if ($pdfs -contains $s) { $ordered += $s } }; foreach ($s in $pdfs) { if ($ordered -notcontains $s) { $ordered += $s } }; return $ordered }
  return @($pdfs | Sort-Object)
}
function NewestLog($st) { Get-ChildItem -Path (Join-Path $lane "coordination") -Filter "muse-launch-intake-$st*.jsonl" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 }
function ReadTail($file, $bytes) {
  try { $fs = [System.IO.File]::Open($file.FullName, 'Open', 'Read', 'ReadWrite'); $len = $fs.Length; $start = [Math]::Max(0, $len - $bytes); $fs.Seek($start, 'Begin') | Out-Null; $buf = New-Object byte[] ($len - $start); $fs.Read($buf, 0, $buf.Length) | Out-Null; $fs.Close(); return [System.Text.Encoding]::UTF8.GetString($buf) } catch { return "" }
}
function Status($st) {
  # returns: never | running | finished | complete ; also detects 429 reset times.
  # A LIVE launch always wins over an older report (CA/VA had stale "blocked" reports from their first attempts — the runner
  # counted them complete and over-filled to 7 loops, 2026-10-28 01:21Z). Report counts only if newer than the newest launch log.
  $log = NewestLog $st
  $report = Get-Item -Path (Join-Path $lane "coordination\MUSE-INTAKE-$st-REPORT.md") -ErrorAction SilentlyContinue
  if (-not $log) { if ($report) { return "complete" } else { return "never" } }
  $tail = ReadTail $log 400000
  $live = (-not ($tail -match '"payload_type":"run\.terminal')) -and ((Get-Date) - $log.LastWriteTime -lt [TimeSpan]::FromMinutes(20))
  if ($live) { return "running" }
  if ($report -and $report.LastWriteTime -gt $log.LastWriteTime.AddMinutes(-5)) { return "complete" }
  if ($tail -match 'quota exhausted[^"]*resets at (\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)') {
    $t = [DateTime]::Parse($Matches[1]).ToUniversalTime().ToLocalTime()
    if ($t -gt $script:pauseUntil) { $script:pauseUntil = $t.AddMinutes(2); Log "429 seen for $st → pausing launches until $($script:pauseUntil)"; SaveState }
  }
  return "finished"
}
$briefV2 = Join-Path $lane "coordination\MUSE-STATE-INTAKE-BRIEF-v2.md"
function Launch($st, $why) {
  $prompt = Join-Path $lane "coordination\intake\$st.prompt.md"
  # New states run the v2 brief (thin packets + hints); relaunches of states started on v1 keep v1 so their loop stays consistent.
  $useBrief = $brief; if ($why -eq "new" -and (Test-Path $briefV2)) { $useBrief = $briefV2 }
  "STATE=$st`n`n" + (Get-Content -Raw -Path $useBrief) | Set-Content -Path $prompt -Encoding utf8
  $tag = "intake-$st"; if ($why -ne "new") { $tag = "intake-$st-r$($relaunches[$st])" }
  $p = Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $launcher, "-Brief", $prompt, "-Tag", $tag) -PassThru -WindowStyle Hidden
  Log "launched ($why): $st pid $($p.Id) → coordination\muse-launch-$tag.jsonl"
}

$stagedNow = Staged
Log "queue runner start: max $MaxParallel parallel, poll ${PollSeconds}s, staged: $($stagedNow -join ', ')"
while ($true) {
  $stagedNow = Staged
  # Worker boundary (founder 2026-10-28): states assigned to another worker in runs\_intake\QUEUE.json are not Muse's.
  $notMine = @()
  try { $q = Get-Content -Raw (Join-Path $lane "runs\_intake\QUEUE.json") | ConvertFrom-Json; foreach ($r in $q.queue) { if ($r.worker -and $r.worker -ne "muse") { $code = ("" + $r.jurisdiction).Replace("US-", "").ToUpper(); if ($code.Length -eq 2) { $notMine += $code } } } } catch {}
  $states = @($stagedNow | Where-Object { ($skip -notcontains $_) -and ($notMine -notcontains $_) })
  $running = @(); $candidates = @()
  foreach ($st in $states) {
    $s = Status $st
    if ($s -eq "running") { $running += $st }
    elseif ($s -eq "never") { $candidates += @{ st = $st; why = "new" } }
    elseif ($s -eq "finished") { if (-not $relaunches.ContainsKey($st)) { $relaunches[$st] = 0 }; if ($relaunches[$st] -lt 3) { $candidates += @{ st = $st; why = "relaunch" } } }
  }
  # Order (2026-10-28 22:48): states with a run dir and progress resume FIRST (finish what is started), then AZ (v2 pilot), then the rest by name.
  $withRun = @(); $pilot = @(); $rest = @()
  foreach ($c in $candidates) { $lower = $c.st.ToLower(); if (Get-ChildItem -Path (Join-Path $lane "runs") -Directory -Filter "2026-10-28-rdmv-$lower-*" -ErrorAction SilentlyContinue) { $withRun += $c } elseif ($c.st -eq "AZ") { $pilot += $c } else { $rest += $c } }
  $candidates = @($withRun + $pilot + $rest)
  if ($NoNew) { $candidates = @($withRun) }  # founder 2026-10-28 22:58: only resume the incomplete states; start nothing new
  $slots = $MaxParallel - $running.Count
  if ((Get-Date) -lt $script:pauseUntil) { if ($candidates.Count -gt 0) { Log "paused until $($script:pauseUntil) (429); running: $($running -join ',')" } }
  elseif ($slots -gt 0 -and $candidates.Count -gt 0) {
    foreach ($c in ($candidates | Select-Object -First $slots)) {
      if ($c.why -eq "relaunch") { $relaunches[$c.st] = $relaunches[$c.st] + 1; SaveState }
      Launch $c.st $c.why; Start-Sleep -Seconds 8
    }
  } elseif ($candidates.Count -eq 0 -and $running.Count -eq 0) { Log "idle: nothing staged to run (drop <ST>.pdf + <ST>.url.txt into runs\_intake\sources\private)" }
  Start-Sleep -Seconds $PollSeconds
}
