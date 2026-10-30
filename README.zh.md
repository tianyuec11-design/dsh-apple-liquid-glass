# 液态玻璃 · DSH Apple Liquid Glass

给 DeepSeek Harness 的输入框、左侧侧边栏可点击项、模型选择器和发送按钮加一层 Apple 风格的液态玻璃材质。强度 **0–100% 实时可调**，0% 时完全回到原生外观；页面背景保持不变。

![浅色效果](docs/preview-light.png)

![深色效果](docs/preview-dark.png)

> 截图来自真实的 DSH 0.2.1-rc.5 Web profile。主题不修改页面背景，只处理四类控件。

---

## 安装

仓库：<https://github.com/tianyuec11-design/dsh-apple-liquid-glass>

### 方式一：从 GitHub 安装（推荐）

**DSH Desktop**

1. 打开 DSH Desktop，进入侧边栏的 **插件** 页面。
2. 点 **添加插件 / +**，选择 **安装第三方插件**（Install a third-party plugin）。
3. 粘贴仓库地址：

   ```text
   https://github.com/tianyuec11-design/dsh-apple-liquid-glass
   ```

4. 点 **安装**。完成后点 **启用**，刷新页面（或按宿主提示重启）。
5. 右上角会出现一个水滴形状的 **液态玻璃** 按钮，点开即可调强度。

**`dsh web`**

```powershell
dsh plugin --profile web add 'github:tianyuec11-design/dsh-apple-liquid-glass'
```

然后重启 `dsh web`（或按 CLI 提示操作）。`dsh plugin` 需要 PATH 里有 pnpm；桌面版由桌面应用自带包管理器，不需要你手动装 pnpm。

**GitHub Release 压缩包**

如果已经发布 release，也可以直接安装固定版本：

```text
https://github.com/tianyuec11-design/dsh-apple-liquid-glass/releases/download/v0.1.0/dsh-apple-liquid-glass-0.1.0.tgz
```

> dshmarket 的 **主题** 标签页只列出目录中收录的主题；从 GitHub 安装的这个主题会出现在 **已安装插件** 里，这是正常的。它仍然是一个完整的 bundle 主题插件，可以正常启用/停用。

### 方式二：从本地文件夹安装（当前开发版）

1. 插件页 → **添加插件 / +** → **安装第三方插件**。
2. 粘贴这个文件夹的绝对路径：

   ```text
   C:\Users\CTY\Desktop\learning project\deepseekharnesslearning\dsh-apple-liquid-glass
   ```

3. 安装 → **启用** → 刷新。

如果插件管理器不方便选文件夹，也可以使用构建好的压缩包（见下方「构建安装包」），把 `.tgz` 的绝对路径粘贴进去。若你的桌面版不接受本地压缩包，请改用文件夹路径。

`dsh web` 的本地安装命令：

```powershell
dsh plugin --profile web add "C:\Users\CTY\Desktop\learning project\deepseekharnesslearning\dsh-apple-liquid-glass"
```

### 方式三：自己构建压缩包

在插件目录运行：

```powershell
node scripts/build.mjs
npm pack
```

会生成 `dsh-apple-liquid-glass-0.1.0.tgz`。在插件管理器的「安装第三方插件」里粘贴这个 `.tgz` 的绝对路径即可。

---

## 使用

- 右上角水滴按钮显示当前强度；点击展开面板。
- 拖动滑杆，或在滑杆上滚动滚轮（`Shift` + 滚轮一次 5%）。
- 四个快捷档：**关闭 / 轻 / 中 / 强**，分别对应 0 / 35 / 65 / 100。
- **重置** 回到默认 62%。
- `Esc` 或点击面板外关闭；面板关闭后焦点回到水滴按钮。
- 设置按浏览器保存（`localStorage` 键：`dsh-apple-liquid-glass.settings.v1`），刷新、重启后保留。
- **0% 不是半透明，而是完全移除主题覆盖**：所有表面回到 DSH 原生渲染，只有调节按钮保留。

### 玻璃范围

| 区域 | 具体元素 |
| --- | --- |
| 输入框 | 输入卡片、`+` 添加按钮、访问模式胶囊 |
| 左侧侧边栏 | 品牌/新建会话、面板导航行、工作区行、会话行、底部设置/账号行；小图标按钮在悬停/聚焦时呈现玻璃 |
| 模型选择 | 输入框内的模型选择触发器 |
| 发送 | 发送/停止按钮 |

页面背景、对话气泡、顶部栏、模型下拉菜单本身暂不处理；这些留到后续迭代。

---

## 实现说明

- **纯 CSS 材质 + 一个轻量 DOM 控制器**，浏览器半不依赖 React 或第三方库。
- 输入卡的 `backdrop-filter` 放在 `::before` 伪元素上，避免把输入卡变成内部 fixed 弹层的 backdrop root；层叠用 `isolation: isolate` 隔离。
- 侧边栏只处理可点击元素本身，不绘制整个侧边栏，因此背景保持原样。
- 指针移动时通过 `--dslg-mx/--dslg-my` 更新高光位置；按压时用 `scale` 做轻微液体回弹，不覆盖宿主自己的 `transform`。
- 0% 时移除 `body[data-dslg-glass="on"]` 与全部 `--dslg-*` 变量，所有选择器失效，原生样式不受影响。
- 尊重 `prefers-reduced-motion` 与 `prefers-reduced-transparency`。
- 深浅色跟随宿主：宿主设置 `body[data-ds-dark-theme]` 时自动切换深色玻璃。

### 文件结构

```text
dsh-apple-liquid-glass/
├─ package.json
├─ cordis.patch.yml          # bundle 注册
├─ lib/
│  ├─ index.js               # 宿主半：空实现
│  └─ client.js              # 构建产物，浏览器半
├─ src/
│  ├─ client.js              # 控制器源码
│  └─ style.css              # 材质源码
├─ scripts/build.mjs         # 把 src 包装成 DSH 的 ModuleLoader bundle
├─ preview/harness.html      # 本地静态预览（开发用）
├─ docs/                     # README 截图
└─ assets/icon.svg
```

### 开发

```powershell
# 修改 src/style.css 或 src/client.js 后
node scripts/build.mjs

# 静态预览（先构建，然后用浏览器打开）
start .\preview\harness.html
```

预览页支持 `?theme=light|dark&level=0..100&panel=1&hover=1&lang=en`。它用模拟 DOM 展示材质，真实宿主验证请以 DSH 为准。

用本地文件夹安装后，DSH 的 HMR 可能会直接重载；如果样式没变，刷新页面或重启宿主。桌面版插件管理器安装的是一份副本，修改源码后需要重新安装或改用 link 安装。

---

## 兼容性

- 要求 DSH **>= 0.2.1-0**。
- 已在 **DSH 0.2.1-rc.5 Web profile** 实机验证（浅色 / 深色、0% / 62% / 100%）。
- 桌面版使用同一套 Web 客户端；调节按钮已通过 `--dsh-windows-titlebar-height` 预留标题栏偏移，但桌面实机仍建议你本地验收一次。
- 只在 Chromium/Electron 内核验证；没有测试 Safari/Firefox。

### 已知限制

- 模型下拉菜单本身、对话气泡、顶部栏不在本版范围内。
- 侧边栏里的小图标按钮为了性能和视觉克制，只在悬停/聚焦时出现玻璃；主要行是常驻玻璃。
- 还没有 SVG 边缘折射；目前是「模糊 + 饱和度 + 透明染色 + 高光 + 倒角 + 阴影」的 CSS 材质。
- 调节按钮固定在右上角；如果你在右上角装了别的悬浮插件，可能会重叠。
- 不使用壁纸，不修改页面背景。想要更强的「透出桌面壁纸」效果，需要后续增加背景层或桌面透明支持。

---

## 卸载

- **Desktop**：插件页面 → 这个插件 → **移除**；按提示重启。
- **Web**：

  ```powershell
  dsh plugin --profile web remove dsh-apple-liquid-glass
  ```

  重启 `dsh web` 即可完全移除。

---

## 许可

MIT。见 [LICENSE](LICENSE)。

「Liquid Glass」在这里描述视觉材质；本项目与 Apple Inc. 无隶属或背书关系。
