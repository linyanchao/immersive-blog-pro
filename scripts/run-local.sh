###
 # @Author: linyc
 # @Date: 2026-02-12 18:48:20
 # @LastEditTime: 2026-02-12 18:48:21
 # @LastEditors: linyc
 # @Description: 
### 
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT=5173

cd "$ROOT_DIR"
echo "Starting local server at http://127.0.0.1:${PORT}"
python3 -m http.server ${PORT}