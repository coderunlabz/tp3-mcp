# Sobe o servidor numa janela propria, fora do Cursor.
# Uso: powershell -File scripts/manter-aberto.ps1
#      powershell -File scripts/manter-aberto.ps1 -Fixo
param([switch]$Fixo)

$raiz = Split-Path -Parent $PSScriptRoot
$titulo = if ($Fixo) { 'tp3-mcp-tunel-fixo' } else { 'tp3-mcp-tunel' }
$cmd = if ($Fixo) { 'npm run tunel:fixo' } else { 'npm run tunel' }

Start-Process powershell -WorkingDirectory $raiz -ArgumentList @(
    '-NoExit',
    '-Command',
    "`$Host.UI.RawUI.WindowTitle = '$titulo'; Write-Host 'Fechar o Cursor nao encerra esta janela.'; $cmd"
)
Write-Host "Janela $titulo aberta. Feche o Cursor e confira se o tunel segue."
