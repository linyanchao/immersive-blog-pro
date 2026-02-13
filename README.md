<!--
 * @Author: linyc
 * @Date: 2026-02-12 16:55:28
 * @LastEditTime: 2026-02-13 11:09:17
 * @LastEditors: linyc
 * @Description: 
-->
# Quancy Blog Pro

一个沉浸式博客演示项目，包含跑车开场动画与完整博客页面体系。

## 当前版本

- `v0.5.0`

---

## 已实现功能（Current Features）

### 1) 开场沉浸动画（Three.js）

- 全屏 WebGL 开场场景
- 跑车模型加载（`assets/su7-xiaomini.glb`）
- 模型自动轮轴识别与车轮旋转
- 风阻流线特效（方向与车体运动方向一致）
- 车体净空区（避免流线遮挡车身）
- 地面光影、轮廓光晕、尾部氮气光效
- 镜头字幕（左下角 1.2 秒淡入淡出）

### 2) 镜头语言与交互

- 三组镜头：
  - 前45°英雄镜头
  - 低机位贴地追拍
  - 侧后方极速拉镜
- 切换方式：
  - `V` 键
  - 右键空白区域
  - `1` / `2` / `3`
  - 页面按钮 `🎥 切换视角`
- 左键点击车身：瞬时加速（氮气爆发视觉）
- 滚轮交互：
  - 下滚加速
  - 上滚减速（刹车逻辑）

### 3) 速度与物理反馈

- 推力、空气阻力、滚阻、制动力综合计算
- 点击加速时镜头后坐力与曝光增强
- HUD 速度显示（可达到 `260km/h+`）
- 音乐播放速率随速度变化

### 4) 灯语系统（SU7风格）

- 驻车模式：柔和呼吸灯语
- 行驶模式：动态流水灯语
- 切镜头/加速脉冲联动
- 刹车增强尾灯效果（减速时更亮）

### 5) HUD 与提示系统

- 低干扰 HUD（默认半透明）
- 用户交互时自动亮起
- `H` 键常驻开关
- 显示速度、镜头、风阻强度

### 6) 博客页面系统（Hash 路由）

- 页面：
  - 首页
  - 归档
  - 分类
  - 标签
  - 关于
  - 搜索
  - 文章详情
- 搜索支持：关键词 + 分类 + 标签筛选
- 文章详情支持：
  - 自动目录
  - 滚动高亮
  - 上一篇/下一篇导航

### 7) 通用体验

- 深色/浅色主题切换（本地持久化）
- 顶部阅读进度条
- 回到顶部按钮
- 响应式布局

### 8) 工程与脚本

- 运行与打包脚本统一放在 `scripts/` 目录：
  - `scripts/run-local.bat`
  - `scripts/run-local.sh`
  - `scripts/build-zip.ps1`
  - `scripts/build-zip.sh`
  - `scripts/build-zip.bat`

---

## 项目结构

```text
quancy-blog-pro/
├─ index.html
├─ styles.css
├─ data.js
├─ app.js
├─ README.md
├─ CHANGELOG.md
├─ assets/
│  ├─ su7-xiaomini.glb
│  └─ bgm.mp3
└─ scripts/
   ├─ run-local.bat
   ├─ run-local.sh
   ├─ build-zip.ps1
   ├─ build-zip.sh
   └─ build-zip.bat

