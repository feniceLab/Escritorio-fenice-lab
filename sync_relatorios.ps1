# SINCRONIZADOR DE RELATÓRIOS
# Varre pastas de clientes e gera relatorios-detectados.json
# Uso: clique duplo no arquivo, ou execute no PowerShell

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Join-Path $scriptDir "ASSESSORIA\CLIENTES"
$outputFile = Join-Path $scriptDir "relatorios-detectados.json"

$meses = @{
    "01_JANEIRO"   = "01|Janeiro"
    "02_FEVEREIRO" = "02|Fevereiro"
    "03_MARCO"     = "03|Marco"
    "04_ABRIL"     = "04|Abril"
    "05_MAIO"      = "05|Maio"
    "06_JUNHO"     = "06|Junho"
    "07_JULHO"     = "07|Julho"
    "08_AGOSTO"    = "08|Agosto"
    "09_SETEMBRO"  = "09|Setembro"
    "10_OUTUBRO"   = "10|Outubro"
    "11_NOVEMBRO"  = "11|Novembro"
    "12_DEZEMBRO"  = "12|Dezembro"
}

$reports = @()

foreach ($cf in @("ALPHA", "STARKEN")) {
    $cp = Join-Path $baseDir $cf
    if (-not (Test-Path $cp)) { continue }
    $company = if ($cf -eq "ALPHA") { "Alpha" } else { "Starken" }

    foreach ($clientDir in Get-ChildItem -Path $cp -Directory) {
        if ($clientDir.Name.StartsWith("_") -or $clientDir.Name.StartsWith(".")) { continue }
        $clientName = $clientDir.Name -replace "_", " "

        foreach ($yearDir in Get-ChildItem -Path $clientDir.FullName -Directory) {
            if ($yearDir.Name -notmatch "^\d{4}$") { continue }
            $year = $yearDir.Name

            foreach ($monthDir in Get-ChildItem -Path $yearDir.FullName -Directory) {
                if (-not $meses.ContainsKey($monthDir.Name)) { continue }
                $mi = $meses[$monthDir.Name] -split "\|"
                $mesNum = $mi[0]
                $mesNome = $mi[1]

                foreach ($pdfFile in Get-ChildItem -Path $monthDir.FullName -Filter "*.pdf") {
                    $period = $null
                    if ($pdfFile.Name -match "(\d{8})_(\d{8})") {
                        try {
                            $d1 = [datetime]::ParseExact($Matches[1], "yyyyMMdd", $null).ToString("dd/MM/yyyy")
                            $d2 = [datetime]::ParseExact($Matches[2], "yyyyMMdd", $null).ToString("dd/MM/yyyy")
                            $period = "$d1 a $d2"
                        } catch {}
                    }

                    $displayPeriod = if ($period) { $period } else { "$mesNome $year" }
                    Write-Host "  [$company] $clientName - $displayPeriod - $($pdfFile.Name)"

                    $reports += [PSCustomObject]@{
                        clientName         = $clientName
                        company            = $company
                        filename           = $pdfFile.Name
                        filepath           = $pdfFile.FullName
                        year               = $year
                        month              = $mesNum
                        monthName          = $mesNome
                        periodLabel        = "$mesNome $year"
                        periodFromFilename = $period
                        fileDate           = $pdfFile.LastWriteTime.ToString("o")
                        fileSize           = $pdfFile.Length
                    }
                }
            }
        }
    }
}

$output = [PSCustomObject]@{
    generatedAt  = (Get-Date).ToString("o")
    totalReports = $reports.Count
    reports      = $reports
}

$output | ConvertTo-Json -Depth 5 | Out-File -FilePath $outputFile -Encoding utf8

Write-Host ""
Write-Host "Encontrados $($reports.Count) relatorio(s) em PDF."
Write-Host "Arquivo salvo: $outputFile"
Write-Host ""
Write-Host "Abra o checklist e clique em 'Sincronizar Relatorios' para importar."
Write-Host ""
Write-Host "Pressione Enter para fechar..."
Read-Host
