$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")

$ProjectName = "Linyc-blog-pro"
$OutZip = Join-Path $RootDir "$ProjectName.zip"
$TmpRoot = Join-Path $env:TEMP "pack-$ProjectName"
$Target = Join-Path $TmpRoot $ProjectName

if (Test-Path $TmpRoot) { Remove-Item -Recurse -Force $TmpRoot }
New-Item -ItemType Directory -Force $Target | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Target "assets") | Out-Null

$files = @("index.html","styles.css","data.js","app.js","README.md")
foreach ($f in $files) {
  $src = Join-Path $RootDir $f
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $Target $f) -Force
  } else {
    throw "缺少文件: $f"
  }
}

$carModel = Join-Path $RootDir "assets\su7-xiaomini.glb"
$bgm = Join-Path $RootDir "assets\bgm.mp3"

if (Test-Path $carModel) {
  Copy-Item $carModel (Join-Path $Target "assets\su7-xiaomini.glb") -Force
} else {
  "请放入 assets/su7-xiaomini.glb" | Set-Content (Join-Path $Target "assets\PUT_MODEL_HERE.txt") -Encoding UTF8
}

if (Test-Path $bgm) {
  Copy-Item $bgm (Join-Path $Target "assets\bgm.mp3") -Force
}

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }
Compress-Archive -Path $Target -DestinationPath $OutZip -Force

Remove-Item -Recurse -Force $TmpRoot
Write-Host "打包完成: $OutZip"