# Numérisation directe via WIA (Windows Image Acquisition), sans logiciel constructeur.
# Sortie : "OK:<chemin>" ou "ERR:<code>:<message>"
param([string]$out, [int]$dpi = 300, [string]$mode = "color")
$ErrorActionPreference = "Stop"
try {
  $dm = New-Object -ComObject WIA.DeviceManager
  $infos = @()
  foreach ($i in $dm.DeviceInfos) { if ($i.Type -eq 1) { $infos += $i } }   # 1 = scanner
  if ($infos.Count -eq 0) { Write-Output "ERR:NO_SCANNER:Aucun scanner détecté par Windows (vérifiez qu'il est allumé et branché)"; exit 1 }
  $dev = $infos[0].Connect()
  $item = $dev.Items.Item(1)
  function SetProp($obj, $id, $val) { try { foreach ($p in $obj.Properties) { if ($p.PropertyID -eq $id) { $p.Value = $val; return } } } catch {} }
  # 6146 intent (1 couleur, 2 gris, 4 texte), 6147/6148 résolution, 4104 bits par pixel
  if ($mode -eq "gray") { SetProp $item 6146 2 } elseif ($mode -eq "text") { SetProp $item 6146 4 } else { SetProp $item 6146 1 }
  SetProp $item 6147 $dpi
  SetProp $item 6148 $dpi
  $fmtBMP  = "{B96B3CAB-0728-11D3-9D7B-0000F81EF32E}"
  $fmtJPEG = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}"
  $img = $null
  try { $img = $item.Transfer($fmtJPEG) } catch { $img = $item.Transfer($fmtBMP) }
  if ($img.FormatID -ne $fmtJPEG) {
    $ip = New-Object -ComObject WIA.ImageProcess
    $ip.Filters.Add($ip.FilterInfos.Item("Convert").FilterID)
    $ip.Filters.Item(1).Properties.Item("FormatID").Value = $fmtJPEG
    $ip.Filters.Item(1).Properties.Item("Quality").Value = 88
    $img = $ip.Apply($img)
  }
  if (Test-Path $out) { Remove-Item $out -Force }
  $img.SaveFile($out)
  Write-Output "OK:$out"
} catch {
  $m = $_.Exception.Message -replace "[\r\n]+", " "
  if ($m -match "0x80210006|busy|occup") { Write-Output "ERR:BUSY:Le scanner est occupé (fermez IJ Scan Utility ou attendez la fin du scan en cours)" }
  elseif ($m -match "0x80210015|0x80210005|paper|papier") { Write-Output "ERR:PAPER:Aucun document détecté (posez le document sur la vitre ou dans le chargeur)" }
  elseif ($m -match "0x8021000C|0x80210016|warming|lamp") { Write-Output "ERR:WARMUP:Le scanner chauffe, réessayez dans quelques secondes" }
  else { Write-Output "ERR:WIA:$m" }
  exit 1
}
