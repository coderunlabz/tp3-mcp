# Sobe o tunel rapido numa janela propria, fora do Cursor.
# Uso: powershell -File scripts/manter-aberto.ps1
$raiz = Split-Path -Parent $PSScriptRoot
Start-Process powershell -WorkingDirectory $raiz -ArgumentList @(
    '-NoExit',
    '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'tp3-mcp-tunel'; Write-Host 'Fechar o Cursor nao encerra esta janela.'; npm run tunel"
)
Write-Host 'Janela tp3-mcp-tunel aberta. Feche o Cursor e confira se o tunel segue.'
