'''
Author: linyc
Date: 2026-02-13 14:08:24
LastEditTime: 2026-02-13 14:13:07
LastEditors: linyc
Description: 
'''
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = [
    "index.html", "styles.css", "data.js", "app.js",
    "README.md", "CHANGELOG.md", "vercel.json",
    "src/router/historyRouter.js",
    "src/effects/ghostTrail.js",
    "src/effects/aeroFlow.js",
    "src/core/qualityManager.js",
    "scripts/dev_server.py",
    "scripts/run-local.bat", "scripts/run-local.sh"
]

def chk(path):
    p = ROOT / path
    if not p.exists():
        print(f"[ERR] {path} 缺失")
        return 1
    if p.is_file() and p.stat().st_size == 0:
        print(f"[ERR] {path} 为空")
        return 1
    print(f"[OK] {path}")
    return 0

def main():
    bad = 0
    for f in REQUIRED:
        bad += chk(f)

    model = ROOT / "assets/su7-xiaomini.glb"
    if model.exists():
        print("[OK] assets/su7-xiaomini.glb")
    else:
        print("[ERR] assets/su7-xiaomini.glb 缺失")
        bad += 1

    try:
        data = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        ok = any(x.get("source") == "/(.*)" and x.get("destination") == "/index.html" for x in data.get("rewrites", []))
        if ok: print("[OK] vercel rewrites")
        else:
            print("[ERR] vercel rewrites 配置不完整")
            bad += 1
    except Exception as e:
        print(f"[ERR] vercel.json 解析失败: {e}")
        bad += 1

    print("\n✅ 校验通过" if bad == 0 else f"\n❌ 校验失败: {bad} 项")
    return 0 if bad == 0 else 1

if __name__ == "__main__":
    raise SystemExit(main())