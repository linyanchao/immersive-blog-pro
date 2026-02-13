<!--
 * @Author: linyc
 * @Date: 2026-02-12 16:55:28
 * @LastEditTime: 2026-02-13 14:04:34
 * @LastEditors: linyc
 * @Description: 
-->
# immersive-blog-pro

沉浸式博客演示项目（Three.js 跑车开场 + 完整博客页面）。

## 功能

- 跑车开场：SU7 模型 + 镜头语言 + 交互加速
- 风阻效果：粒子尾流 + 体积雾感（随车方向）
- 幻影拖影：沿车体平行后方偏移（已修正）
- 氮气爆发：闪白 + 冲击波 + 后坐 + 曝光提升
- 灯语：驻车呼吸 / 行驶流水 / 刹车增强
- History 路由：`/` `/archive` `/categories` `/tags` `/about` `/search` `/post?id=...`
- 博客系统：搜索筛选、详情目录高亮、上下篇
- HUD：速度、档位、风阻强度

## 目录

```text
immersive-blog-pro/
├─ index.html
├─ styles.css
├─ data.js
├─ app.js
├─ src/
│  ├─ router/historyRouter.js
│  └─ effects/{ghostTrail.js,aeroFlow.js}
├─ scripts/
│  ├─ dev_server.py
│  ├─ run-local.bat / run-local.sh
│  ├─ build-zip.ps1 / build-zip.sh / build-zip.bat
│  ├─ changelog_sync.py
│  ├─ setup-hooks.bat / setup-hooks.sh
│  └─ githooks/post-commit
├─ vercel.json
├─ README.md
└─ CHANGELOG.md
