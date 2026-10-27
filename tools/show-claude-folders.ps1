param(
    [string]$SessionId,
    [ValidateRange(1, 20)][int]$Limit = 6
)

# Read session metadata only. Does not print messages, query process memory or call Claude.
$sessionRoot = Join-Path $env:USERPROFILE '.claude\projects'
if (-not (Test-Path -LiteralPath $sessionRoot)) {
    Write-Output 'No Claude session metadata directory found.'
    return
}

$sessionFiles = @(
    foreach ($projectDirectory in Get-ChildItem -LiteralPath $sessionRoot -Directory) {
        Get-ChildItem -LiteralPath $projectDirectory.FullName -File -Filter '*.jsonl'
    }
)
if ($SessionId) {
    $sessionFiles = @($sessionFiles | Where-Object BaseName -eq $SessionId)
}

$rows = foreach ($sessionFile in ($sessionFiles | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First $Limit)) {
    $recordedFolder = $null
    # The first records identify startup; recent records capture any later working-folder change.
    $sample = @(Get-Content -LiteralPath $sessionFile.FullName -TotalCount 8)
    $sample += @(Get-Content -LiteralPath $sessionFile.FullName -Tail 250)
    foreach ($line in $sample) {
        if ($line -isnot [string] -or $line -notmatch '"cwd"\s*:') { continue }
        try {
            $entry = $line | ConvertFrom-Json -ErrorAction Stop
            if ($entry.cwd -is [string] -and $entry.cwd) { $recordedFolder = $entry.cwd }
        } catch {
            # A session may still be writing its final JSON line. Never print log contents.
        }
    }
    [pscustomobject]@{
        SessionId       = $sessionFile.BaseName
        RecordedFolder  = $(if ($recordedFolder) { $recordedFolder } else { '(not found in sampled metadata)' })
        LastLogWriteUtc = $sessionFile.LastWriteTimeUtc.ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'
    }
}

$rows | Format-Table -AutoSize
Write-Output 'Recorded folder/activity does not prove a live process or an automatic file watcher.'
