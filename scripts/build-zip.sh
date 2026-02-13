#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PROJECT="immersive-blog-pro"
OUT="$ROOT_DIR/$PROJECT.zip"
TMP="$(mktemp -d)"
TARGET="$TMP/$PROJECT"

mkdir -p "$TARGET/assets" "$TARGET/src/router" "$TARGET/src/effects" "$TARGET/scripts/githooks"

for f in index.html styles.css data.js app.js README.md CHANGELOG.md vercel.json; do
  [ -f "$ROOT_DIR/$f" ] && cp "$ROOT_DIR/$f" "$TARGET/$f"
done

for f in src/router/historyRouter.js src/effects/ghostTrail.js src/effects/aeroFlow.js; do
  [ -f "$ROOT_DIR/$f" ] && cp "$ROOT_DIR/$f" "$TARGET/$f"
done

for f in scripts/dev_server.py scripts/run-local.bat scripts/run-local.sh scripts/build-zip.ps1 scripts/build-zip.sh scripts/build-zip.bat scripts/changelog_sync.py scripts/setup-hooks.bat scripts/setup-hooks.sh scripts/githooks/post-commit; do
  [ -f "$ROOT_DIR/$f" ] && cp "$ROOT_DIR/$f" "$TARGET/$f"
done

[ -f "$ROOT_DIR/assets/su7-xiaomini.glb" ] && cp "$ROOT_DIR/assets/su7-xiaomini.glb" "$TARGET/assets/su7-xiaomini.glb"
[ -f "$ROOT_DIR/assets/bgm.mp3" ] && cp "$ROOT_DIR/assets/bgm.mp3" "$TARGET/assets/bgm.mp3"

rm -f "$OUT"
(
  cd "$TMP"
  zip -r "$OUT" "$PROJECT" >/dev/null
)

rm -rf "$TMP"
echo "打包完成: $OUT"