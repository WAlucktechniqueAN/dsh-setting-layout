# dsh-settings-layout · 设置面板位置大小控制

一个 DeepSeek Harness（DSH）Web 插件：控制「设置」面板的**位置**与**大小**，支持窗口式拖动与缩放，布局自动持久化保存。

## 功能

| 能力 | 说明 |
| --- | --- |
| 停靠预设 | 九宫格停靠（左上/中上/右上/左中/居中/右中/左下/中下/右下） |
| 精确微调 | X/Y 偏移（px，支持负值）、宽度、高度（支持 `auto` 自适应），带 −/＋ 步进 |
| 尺寸预设 | 紧凑 640×480 / 标准 800 / 宽屏 960 / 高度自适应 |
| 窗口式拖动 | 按住面板**顶部标题栏空白处**拖动即可移动位置 |
| 边缘缩放 | 按住面板**任意边缘/四角**（10px 热区）拖动即可调整大小，对边自动锚定 |
| 光标提示 | 悬停边缘显示缩放光标，悬停标题栏显示移动光标 |
| 持久化 | 布局自动存入 `localStorage`，刷新页面、重启 DSH 后保持 |
| 恢复默认 | 一键还原居中 800px 出厂样式 |

## 安装

插件包**零依赖、零构建**（`lib/client.js` 是手写纯 JS，无 `prepare` 脚本）——别人安装时不会被 pnpm 的构建脚本策略卡住。**安装方**只需有 `dsh` CLI 与 `pnpm`。

在 DSH 的 web profile 中执行：

```bash
# GitHub 仓库（发布后）
dsh plugin --profile web add https://github.com/<你>/dsh-settings-layout.git

# 本地目录（link: 为符号链接，改代码后重启即生效）
dsh plugin --profile web add link:/path/to/dsh-settings-layout

# 或 npm 发布后
#   npm publish
dsh plugin --profile web add dsh-settings-layout
```

然后**重启 dsh web**（插件集变更需重启生效；注意：重启 ≠ 刷新页面，须先结束占用 3080 端口的旧进程再启动）。重启后打开设置 → 导航栏最下方出现「**面板布局**」页面。

> 也可以手动安装：把 `dsh-settings-layout` 加入 `~/.dsh/profiles/web/package.json` 的依赖并执行 `pnpm install`，随后在 `dsh.profile.bundles` 中加入 `dsh-settings-layout`（声明了 `dsh.bundle` 的依赖会自动加入，无需手改）。

## 使用

1. 点击侧边栏底部的齿轮打开「设置」；
2. 在左侧导航选择「**面板布局**」；
3. 调整停靠位置 / 偏移 / 大小，**实时生效**；
4. 或直接拖动标题栏移动面板、拖拽边缘/四角缩放（像操作窗口一样）。

## 卸载

```bash
dsh plugin --profile web remove dsh-settings-layout
```

## 原理（简要）

- 设置对话框是界面中**唯一**同时带 `role="dialog"` + `aria-modal="true"` + `aria-labelledby` 的元素（Modal 与图片灯箱用 `aria-label`），因此插件用这一组合精确锁定设置面板，不会影响其他弹窗。
- 几何通过 `:root` 上的 CSS 自定义属性驱动：overlay 的 flex 对齐（停靠锚点）+ 对话框的 `width/height/margin/transform`（大小与偏移）。
- 拖动/缩放采用 document 级指针事件委托，只作用于设置对话框，按钮/输入框/滚动区不触发拖动；监听器随插件卸载自动移除。

## 兼容性

- 纯浏览器端插件（node 半身仅占位），无宿主依赖；
- 需要现代浏览器（`:has()` 选择器，Chrome 105+ / Edge / Firefox 121+ / Safari 15.4+）；
- 使用主题 CSS 变量着色，自动适配明暗主题。

## 许可

MIT
