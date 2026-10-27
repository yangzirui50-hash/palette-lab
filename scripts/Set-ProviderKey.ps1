param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('deepseek', 'unsplash')]
    [string]$Provider,
    [SecureString]$SecureValue,
    [string]$EnvFile = (Join-Path (Split-Path $PSScriptRoot -Parent) '.dev.vars')
)

$ErrorActionPreference = 'Stop'
$variableName = if ($Provider -eq 'deepseek') { 'AI_API_KEY' } else { 'UNSPLASH_ACCESS_KEY' }
$bstr = [IntPtr]::Zero

try {
    Write-Host "Configure $variableName for local development only." -ForegroundColor Cyan
    Write-Host 'Input is hidden. The value is excluded from Git. Press Enter without input to cancel.'
    if ($null -eq $secureValue) {
        $secureValue = Read-Host "Enter $variableName" -AsSecureString
    }
    if ($secureValue.Length -eq 0) {
        Write-Host 'Cancelled. No file was changed.'
        exit 0
    }

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim()
    if ($plainValue -notmatch '^[A-Za-z0-9_.-]+$') {
        throw 'The key contains unsupported characters. No file was changed.'
    }

    $lines = @()
    if ([IO.File]::Exists($EnvFile)) {
        $lines = [IO.File]::ReadAllLines($EnvFile)
    }
    $escapedName = [Regex]::Escape($variableName)
    $replacement = "$variableName=$plainValue"
    $found = $false
    for ($index = 0; $index -lt $lines.Count; $index += 1) {
        if ($lines[$index] -match "^$escapedName=") {
            $lines[$index] = $replacement
            $found = $true
        }
    }
    if (-not $found) {
        $lines += $replacement
    }

    [IO.File]::WriteAllLines($EnvFile, $lines, [Text.UTF8Encoding]::new($false))
    Write-Host "$variableName was saved locally. The secret was not displayed." -ForegroundColor Green
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    if ($null -ne $secureValue) {
        $secureValue.Dispose()
    }
}
