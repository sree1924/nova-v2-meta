# Offline Windows voice comparison. No credentials, network requests, or paid APIs.
# All outputs are samples; this never marks a course's narration complete.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$laneRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$sourceManifestPath = Join-Path $laneRoot 'scratch/store-local/audio-ID/generated-samples/sample-manifest.json'
$sourceManifest = Get-Content -Raw -LiteralPath $sourceManifestPath | ConvertFrom-Json
$passage = @($sourceManifest.entries | Where-Object label -EQ 'answer')
if ($passage.Count -ne 1) { throw 'Expected one source-pinned Idaho answer passage' }
$passage = $passage[0]
$spokenText = [string]$passage.spoken_text
$sourcePath = Join-Path $laneRoot ('app-preview/' + $passage.source.file)
$sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sourceHash -ne $passage.source.sha256.Replace('sha256:', '')) { throw 'The pinned accepted source changed; do not reuse a stale passage' }
$utf8 = [Text.UTF8Encoding]::new($false)
$sha = [Security.Cryptography.SHA256]::Create()
$textHash = ([BitConverter]::ToString($sha.ComputeHash($utf8.GetBytes($spokenText)))).Replace('-', '').ToLowerInvariant()
$sha.Dispose()
if ($textHash -ne $passage.spoken_text_sha256) { throw 'Source narration text hash mismatch' }
$sourceDoc = Get-Content -Raw -LiteralPath $sourcePath | ConvertFrom-Json
$sourceScript = @($sourceDoc.audio_scripts | Where-Object card_id -EQ $passage.id)
if ($sourceScript.Count -ne 1) { throw 'The accepted card script is missing or ambiguous' }
$answer = $sourceScript[0].segments.answer
$expectedText = if ($answer.lead_in) { [string]$answer.lead_in + ' ' + [string]$answer.text } else { [string]$answer.text }
if ($expectedText -cne $spokenText) { throw 'Narration passage differs from the accepted card script' }
$ffmpeg = 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe'
if (!(Test-Path -LiteralPath $ffmpeg)) { throw 'Existing ffmpeg encoder is required' }
$outDir = Join-Path $laneRoot 'scratch/store-local/audio-ID/windows-tts-samples'
[IO.Directory]::CreateDirectory($outDir) | Out-Null
Add-Type -AssemblyName System.Speech
$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$entries = @()
$inventory = @($synth.GetInstalledVoices() | ForEach-Object {
  [pscustomobject]@{name=$_.VoiceInfo.Name; culture=$_.VoiceInfo.Culture.Name; gender=$_.VoiceInfo.Gender.ToString(); enabled=$_.Enabled}
})
$jobs = @(
  @{voice='Microsoft Zira'; rate=0; name='idaho-zira-steady'; label='Zira - steady'},
  @{voice='Microsoft Zira'; rate=-1; name='idaho-zira-unhurried'; label='Zira - unhurried'},
  @{voice='Microsoft Mark'; rate=-1; name='idaho-mark-unhurried'; label='Mark - unhurried'},
  @{voice='Microsoft David'; rate=-1; name='idaho-david-unhurried'; label='David - unhurried'}
)
try {
  foreach ($job in $jobs) {
    if (!($inventory | Where-Object { $_.name -eq $job.voice -and $_.enabled })) { throw ('Installed voice unavailable: ' + $job.voice) }
    $wav = Join-Path $outDir ($job.name + '.wav')
    $mp3 = Join-Path $outDir ($job.name + '.mp3')
    $synth.SelectVoice($job.voice)
    $synth.Rate = $job.rate
    $synth.Volume = 100
    $format = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(24000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $synth.SetOutputToWaveFile($wav, $format)
    $started = [DateTime]::UtcNow
    $synth.Speak($spokenText)
    $synth.SetOutputToNull()
    if ((Get-Item -LiteralPath $wav).Length -le 1000) { throw 'Synthesizer emitted an empty or tiny WAV' }
    & $ffmpeg -y -hide_banner -loglevel error -i $wav -ac 1 -ar 24000 -b:a 128k $mp3
    if ($LASTEXITCODE -ne 0) { throw ('MP3 encoding failed for ' + $job.voice) }
    $probe = (& $ffmpeg -hide_banner -i $mp3 -f null - 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0 -or $probe -notmatch '24000 Hz, mono' -or $probe -notmatch '128 kb/s') { throw ('MP3 media validation failed for ' + $job.voice) }
    $time = [regex]::Match($probe, 'Duration:\s*(\d+):(\d+):([\d.]+)')
    if (!$time.Success) { throw 'MP3 duration is unavailable' }
    $duration = [double]$time.Groups[1].Value * 3600 + [double]$time.Groups[2].Value * 60 + [double]::Parse($time.Groups[3].Value, [Globalization.CultureInfo]::InvariantCulture)
    $silenceCheck = (& $ffmpeg -hide_banner -i $mp3 -af volumedetect -f null - 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'Audio signal check failed' }
    $peakMatch = [regex]::Match($silenceCheck, 'max_volume:\s*(-?[\d.]+) dB')
    if (!$peakMatch.Success) { throw 'Audio is silent or peak evidence is unavailable' }
    $peak = [double]::Parse($peakMatch.Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
    if ($duration -lt 3 -or $peak -lt -45) { throw 'Sample contains too little audible audio' }
    $entries += [pscustomobject]@{
      label=$job.label; voice=$job.voice; culture=$synth.Voice.Culture.Name; sapi_rate=$job.rate
      file=$mp3; wav_original=$wav; bytes=(Get-Item -LiteralPath $mp3).Length
      sha256=(Get-FileHash -LiteralPath $mp3 -Algorithm SHA256).Hash.ToLowerInvariant()
      wav_sha256=(Get-FileHash -LiteralPath $wav -Algorithm SHA256).Hash.ToLowerInvariant()
      codec='mp3'; sample_rate_hz=24000; channels=1; bitrate_kbps=128
      duration_seconds=$duration; max_volume_db=$peak; decode_verified=$true
      source_text_rewritten=$false; asr_verified=$false; human_listening_verified=$false
      elapsed_synthesis_seconds=([DateTime]::UtcNow - $started).TotalSeconds
    }
    [pscustomobject]@{voice=$job.voice; rate=$job.rate; file=$mp3; duration_seconds=$duration; peak_db=$peak} | ConvertTo-Json -Compress | Write-Output
  }
} finally { $synth.Dispose() }
$manifest = [pscustomobject]@{
  artifact='WindowsTtsIdahoSampleManifest'; generated_at=[DateTime]::UtcNow.ToString('o')
  engine='Windows System.Speech.Synthesis / installed SAPI voices'; provider='local_windows'
  state='ID'; scope='four_voice_comparison_samples_only'; paid_api_calls=0; network_requests=0; api_cost_usd=0
  text=$spokenText; spoken_text_sha256=$textHash; source=$passage.source
  source_fact=$passage.id; source_artifact_hash_verified=$true; source_script_text_exact=$true
  installed_voices=$inventory; entries=$entries
  note='Local Windows desktop voices; no Azure, Edge cloud, subscription voice recording or OpenAI calls. Full course narration and source QA remain unfinished.'
}
[IO.File]::WriteAllText((Join-Path $outDir 'sample-manifest.json'), ($manifest | ConvertTo-Json -Depth 8), $utf8)
[IO.File]::WriteAllText((Join-Path $outDir 'spoken-text.txt'), $spokenText, $utf8)
Write-Output ('DONE: ' + $entries.Count + ' local Windows samples; no paid API calls.')
