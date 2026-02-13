###
 # @Author: linyc
 # @Date: 2026-02-12 18:48:38
 # @LastEditTime: 2026-02-12 18:48:39
 # @LastEditors: linyc
 # @Description: 
### 
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PROJECT="Linyc-blog-pro"
OUT="$ROOT_DIR/$PROJECT.zip"
TMP="$(mktemp -d)"
TARGET="$TMP/$PROJECT"

mkdir -p "$TARGET/assets"

for f in index.html styles.css data.js app.js README.md; do
  if [ ! -f "$ROOT_DIR/$f" ]; then
    echo "缺少文件: $f"
    exit 1
  fi
  cp "$ROOT_DIR/$f" "$TARGET/$f"
done

if [ -f "$ROOT_DIR/assets/su7-xiaomini.glb" ]; then
  cp "$ROOT_DIR/assets/su7-xiaomini.glb" "$TARGET/assets/su7-xiaomini.glb"
else
  echo "请放入 assets/su7-xiaomini.glb" > "$TARGET/assets/PUT_MODEL_HERE.txt"
fi

if [ -f "$ROOT_DIR/assets/bgm.mp3" ]; then
  cp "$ROOT_DIR/assets/bgm.mp3" "$TARGET/assets/bgm.mp3"
fi

rm -f "$OUT"
(
  cd "$TMP"
  zip -r "$OUT" "$PROJECT" >/dev/null
)

rm -rf "$TMP"
echo "打包完成: $OUT"