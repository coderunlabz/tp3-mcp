# Instala o servidor MCP como tarefa no logon (sem o token da Cloudflare).
# PowerShell: powershell -File scripts/instalar-servidor.ps1 -Hostname SEU-HOST.cfargotunnel.com
# Remover:  powershell -File scripts/instalar-servidor.ps1 -Remover
param(
    [string]$Hostname,
    [switch]$Remover
)

$nome = 'tp3-mcp-servidor'
$raiz = Split-Path -Parent $PSScriptRoot

if ($Remover) {
    Unregister-ScheduledTask -TaskName $nome -Confirm:$false -ErrorAction Stop
    Write-Host "Tarefa $nome removida. Os arquivos em registro/ permanecem no disco."
    exit 0
}

if (-not $Hostname) {
    Write-Error 'Passe -Hostname com o endereco fixo (sem https://). O token da Cloudflare nao entra aqui.'
    exit 1
}

$envPath = Join-Path $raiz '.env'
$linha = "HOSTS=$Hostname"
if (Test-Path $envPath) {
    $texto = Get-Content $envPath -Raw
    if ($texto -match '(?m)^HOSTS=') {
        $texto = [regex]::Replace($texto, '(?m)^HOSTS=.*$', $linha)
    } else {
        $texto = $texto.TrimEnd() + "`r`n$linha`r`n"
    }
    Set-Content -Path $envPath -Value $texto -NoNewline
} else {
    Set-Content -Path $envPath -Value "$linha`r`nPORT=3000`r`n"
}

$argumentos = "-NoProfile -WindowStyle Hidden -Command `"Set-Location '$raiz'; npm start`""
$acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argumentos -WorkingDirectory $raiz
$gatilho = New-ScheduledTaskTrigger -AtLogOn
$ajuste = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho -Settings $ajuste -Force | Out-Null
Start-ScheduledTask -TaskName $nome
Write-Host "Tarefa $nome registrada. HOSTS=$Hostname"
Write-Host 'Reiniciar o Node nao apaga registro/duvidas.jsonl nem registro/ideias.jsonl.'
Write-Host 'O token do cloudflared nao e usado por este script.'
