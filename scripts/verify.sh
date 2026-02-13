###
 # @Author: linyc
 # @Date: 2026-02-13 14:09:46
 # @LastEditTime: 2026-02-13 14:09:48
 # @LastEditors: linyc
 # @Description: 
### 
#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
python3 scripts/verify_project.py