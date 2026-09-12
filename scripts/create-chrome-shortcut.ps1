# Script para criar atalho do Google Chrome configurado para o Antigravity IDE
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Google Chrome (Antigravity).lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut.Arguments = "--remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=`"C:\Users\Suporte\.gemini\chrome-profile`""
$Shortcut.IconLocation = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
$Shortcut.Description = "Google Chrome integrado ao Antigravity IDE (Porta 9222 CDP)"
$Shortcut.Save()

Write-Host "Atalho criado com sucesso em: $ShortcutPath"
