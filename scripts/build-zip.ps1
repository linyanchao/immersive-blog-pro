$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")

$ProjectName = "immersive-blog-pro"
$OutZip = Join-Path $RootDir "$ProjectName.zip"
$TmpRoot = Join-Path $env:TEMP "pack-$ProjectName"
$Target = Join-Path $TmpRoot $ProjectName

if (Test-Path $TmpRoot) { Remove-Item -Recurse -Force $TmpRoot }
New-Item -ItemType Directory -Force $Target | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Target "assets") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Target "src\router") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Target "src\effects") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Target "scripts\githooks") | Out-Null

$rootFiles = @("index.html","styles.css","data.js","app.js","README.md","CHANGELOG.md","vercel.json")
foreach ($f in $rootFiles) {
  $src = Join-Path $RootDir $f
  if (Test-Path $src) { Copy-Item $src (Join-Path $Target $f) -Force }
}

$srcFiles = @("src\router\historyRouter.js","src\effects\ghostTrail.js","src\effects\aeroFlow.js")
foreach ($f in $srcFiles) {
  $src = Join-Path $RootDir $f
  if (Test-Path $src) { Copy-Item $src (Join-Path $Target $f) -Force }
}

$scriptFiles = @("scripts\dev_server.py","scripts\run-local.bat","scripts\run-local.sh","scripts\build-zip.ps1","scripts\build-zip.sh","scripts\build-zip.bat","scripts\changelog_sync.py","scripts\setup-hooks.bat","scripts\setup-hooks.sh","scripts\githooks\post-commit")
foreach ($f in $scriptFiles) {
  $src = Join-Path $RootDir $f
  if (Test-Path $src) { Copy-Item $src (Join-Path $Target $f) -Force }
}

$carModel = Join-Path $RootDir "assets\su7-xiaomini.glb"
$bgm = Join-Path $RootDir "assets\bgm.mp3"
if (Test-Path $carModel) { Copy-Item $carModel (Join-Path $Target "assets\su7-xiaomini.glb") -Force }
if (Test-Path $bgm) { Copy-Item $bgm (Join-Path $Target "assets\bgm.mp3") -Force }

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }
Compress-Archive -Path $Target -DestinationPath $OutZip -Force

Remove-Item -Recurse -Force $TmpRoot
Write-Host "打包完成: $OutZip"