$ErrorActionPreference = 'Stop'
try {
    $value = (Get-Clipboard -Raw).Trim()
    if ($value -notmatch '^sk-[A-Za-z0-9_-]{16,}$') {
        throw 'Clipboard does not contain a valid DeepSeek API key. No file was changed.'
    }
    $secureValue = ConvertTo-SecureString $value -AsPlainText -Force
    & (Join-Path $PSScriptRoot 'Set-ProviderKey.ps1') -Provider deepseek -SecureValue $secureValue
    if ($LASTEXITCODE -ne 0) { throw 'Local configuration failed.' }
    Write-Host 'DeepSeek local configuration completed without displaying the key.'
}
finally {
    Set-Clipboard -Value ' '
}
