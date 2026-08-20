[README.md](https://github.com/user-attachments/files/31273353/README.md)
# dsh-setting-layout
让deepseek harness的设置面板打开时调节大小，不再遮挡视野
# dsh-settings-layout · 设置面板位置大小控制 / Settings Panel Layout Control

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Zero-build](https://img.shields.io/badge/build-none-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-DSH%20web-lightgrey.svg)

> 中文 | [English](#english)

一个 DeepSeek Harness（DSH）Web 插件：控制「设置」面板的**位置**与**大小**，支持窗口式拖动与缩放，布局自动持久化保存。

A DeepSeek Harness (DSH) web plugin that controls the **position** and **size** of the Settings panel — window-like drag & resize, with layout persisted automatically.

---

## 功能 / Features

| 中文能力 | English |
| --- | --- |
| 停靠预设：九宫格（左上/中上/右上/左中/居中/右中/左下/中下/右下） | Nine-cell docking presets (TL/TC/TR/ML/center/MR/BL/BC/BR) |
| 精确微调：X/Y 偏移（px，支持负值）、宽度、高度（支持 `auto`），带 −/＋ 步进 | Fine tuning: X/Y offset (px, negatives OK), width, height (`auto` supported), −/＋ steppers |
| 尺寸预设：紧凑 640×480 / 标准 800 / 宽屏 960 / 高度自适应 | Size presets: Compact 640×480 / Standard 800 / Wide 960 / auto height |
| 窗口式拖动：按住面板**顶部标题栏空白处**移动位置 | Window-style drag: grab the **title-bar blank area** to move the panel |
| 边缘缩放：拖拽**任意边缘/四角**（10px 热区），对边自动锚定 | Edge resize: drag **any edge/corner** (10px hot zone), opposite edge stays anchored |
| 光标提示：悬停边缘显示缩放光标、标题栏显示移动光标 | Cursor hints: resize cursors on edges, move cursor on the title bar |
| 持久化：布局存入 `localStorage`，刷新/重启后保持 | Persistence: layout saved to `localStorage`, survives reloads & restarts |
| 恢复默认：一键还原居中 800px 出厂样式 | Reset: one-click restore to the centered 800px default |

---

## 安装 / Install

插件包**零依赖、零构建**（`lib/client.js` 是手写纯 JS，无 `prepare` 脚本），安装方不会被 pnpm 的构建脚本策略卡住。**安装方**只需 `dsh` CLI 与 `pnpm`。

The package is **zero-dependency and zero-build** (`lib/client.js` is hand-authored plain JS with no `prepare` script), so pnpm's build-script policy never blocks the install. The **installer** only needs the `dsh` CLI and `pnpm`.

```bash
# GitHub 仓库（发布后）/ GitHub repo (after publishing)
dsh plugin --profile web add https://github.com/<you>/dsh-settings-layout.git

# 本地目录（link: 为符号链接，改代码后重启即生效）
# Local directory (link: is a symlink — edit code, restart, done)
dsh plugin --profile web add link:/path/to/dsh-settings-layout

# 或 npm 发布后 / or after npm publish
#   npm publish
dsh plugin --profile web add dsh-settings-layout
```

然后**重启 dsh web**（插件集变更需重启生效；注意：重启 ≠ 刷新页面，须先结束占用 3080 端口的旧进程再启动）。重启后打开设置 → 导航栏最下方出现「**面板布局**」页面。

Then **restart dsh web** (plugin-set changes need a restart; a restart ≠ a page refresh — end the old process holding port 3080 first, then start). After boot, open Settings → the "**面板布局**" page appears at the bottom of the nav.

> 手动安装 / Manual install：把 `dsh-settings-layout` 加入 `~/.dsh/profiles/web/package.json` 的依赖并执行 `pnpm install`；声明了 `dsh.bundle` 的依赖会自动进入 `dsh.profile.bundles`，无需手改。
> Add `dsh-settings-layout` to `~/.dsh/profiles/web/package.json` and run `pnpm install`; dependencies declaring `dsh.bundle` join `dsh.profile.bundles` automatically.

---

## 使用 / Usage

1. 点击侧边栏底部的齿轮打开「设置」/ Click the gear at the sidebar bottom to open **Settings**;
2. 在左侧导航选择「**面板布局**」/ Pick "**面板布局**" in the left nav;
3. 调整停靠位置 / 偏移 / 大小，**实时生效** / Adjust docking / offsets / size — takes effect **live**;
4. 或直接拖动标题栏移动面板、拖拽边缘/四角缩放（像操作窗口一样）/ Or drag the title bar to move the panel and drag edges/corners to resize it, just like a window.

---

## 卸载 / Uninstall

```bash
dsh plugin --profile web remove dsh-settings-layout
```

---

## 原理（简要）/ How it works

- 设置对话框是界面中**唯一**同时带 `role="dialog"` + `aria-modal="true"` + `aria-labelledby` 的元素（Modal 与图片灯箱用 `aria-label`），插件用这一组合精确锁定设置面板，**不会影响其他弹窗**。
  The Settings dialog is the **only** aria-modal element that uses `aria-labelledby` (the Modal primitive and the image lightbox use `aria-label`), so the selectors target it precisely and **never leak onto other dialogs**.
- 几何通过 `:root` 上的 CSS 自定义属性驱动：overlay 的 flex 对齐（停靠锚点）+ 对话框的 `width/height/margin/transform`（大小与偏移）。
  Geometry is driven by CSS custom properties on `:root`: the overlay's flex alignment (docking anchor) plus the dialog's `width/height/margin/transform` (size & offset).
- 拖动/缩放采用 document 级指针事件委托，只作用于设置对话框；按钮/输入框/滚动区不触发拖动；监听器随插件卸载自动移除。
  Drag & resize use document-level pointer-event delegation scoped to the Settings dialog; buttons/inputs/scroll areas never trigger a drag; listeners are removed on plugin unload.

---

## 兼容性 / Compatibility

- 纯浏览器端插件（node 半身仅占位），无宿主依赖 / Pure browser-side plugin (the node half is a placeholder), no host dependency;
- 需要现代浏览器（`:has()` 选择器：Chrome 105+ / Edge / Firefox 121+ / Safari 15.4+）/ Requires a modern browser (`:has()`: Chrome 105+ / Edge / Firefox 121+ / Safari 15.4+);
- 使用主题 CSS 变量着色，自动适配明暗主题 / Uses theme CSS variables, adapts to light & dark themes automatically.

---

## 许可 / License

MIT
