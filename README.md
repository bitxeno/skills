# skills

个人 Agent Skills 集合。分组（pack）定义集中在 `bin/skillpacks.mjs` 的 `PACKS` 表里，一个分组对应一组来源仓库与 skill 名。

安装用本仓库自带的 `skillpacks` CLI，一条命令搞定，且**每次都会装到上游最新版**（`npx skills experimental_install` 那个老路子在技能已存在时会直接跳过、不会更新，见文末说明）。

## 快速安装（推荐）

在**目标项目根目录**执行：

```bash
# 查看所有分组
npx -y github:bitxeno/skills list

# 安装单个分组
npx -y github:bitxeno/skills install ios

# 一次装多个分组
npx -y github:bitxeno/skills install ios go

# 装到别的目录
npx -y github:bitxeno/skills install reverse-web --dir ./MyApp

# 只看会执行什么命令
npx -y github:bitxeno/skills install ios --dry-run
```

| 选项 | 说明 |
| --- | --- |
| `-p, --project` | 装到当前项目（默认） |
| `-g, --global` | 装到用户目录，覆盖分组的默认位置 |
| `--copy` | 复制文件而非符号链接 |
| `--dir <path>` | 指定目标项目目录 |
| `--dry-run` | 只打印将执行的命令 |
| `-h, --help` | 显示帮助 |

可用分组与简称：

| 分组 | 简称 | 说明 |
| --- | --- | --- |
| `swift` | `ios` / `mac` / `macos` | Swift / iOS / macOS 开发 |
| `go` | — | Go 后端 / CLI 开发 |
| `rust` | — | Rust 开发（遗留代码迁移到 Rust） |
| `reverse-ios` | — | iOS / 移动应用逆向 |
| `reverse-android` | `android` | Android 应用逆向 |
| `reverse-web` | `web` | Web 前端 / JS 逆向 |
| `reverse-binary` | `bin` / `binary` | 二进制逆向（IDA / radare2） |
| `app-icon` | `icon` | App 图标生成 |
| `ui-design` | — | 前端 UI 设计（默认装到全局） |

### 它和 `experimental_install` 的区别

`skillpacks` 底层只调用 vercel 的 `skills add`，**不自己下载技能**：

- 技能已存在时，`skills add` 会**覆盖刷新到上游最新**；而 `experimental_install` 见到 `.agents/skills/<name>/SKILL.md` 就直接跳过，永远停在第一次装的那版。
- 不校验任何 hash，上游内容变了照样能装，不会在 CI 里因 `--frozen-lockfile` 报 “has changed since skills-lock.json was written”。
- 按 **skill 名**而不是路径发现，上游调整目录结构也不影响。
- 分组定义就是 `bin/skillpacks.mjs` 里的一张表，位置一目了然。

## 工作原理

`bin/skillpacks.mjs` 把分组名翻译成若干条 `npx -y skills@latest add <repo> -s <skill> -p -y` 并依次执行：

- 同一源仓库的多个 skill 合并成一次 `add`，只 clone 一次。
- 分组定义集中在 `bin/skillpacks.mjs` 的 `PACKS` 表：`[源仓库, [skill 名...]]`，空数组表示装该仓库全部 skill。
- `ui-design` 默认装到全局，用 `-p` 可改为项目级。


## Swift 项目

适用于 iOS / macOS 开发项目，包含 UI 开发规范、命令行构建、模拟器自动化、SQLiteData 用法等技能：

```bash
npx -y github:bitxeno/skills install ios
```

| Skill | 来源 | 说明 |
| --- | --- | --- |
| `swiftui-pro` | [twostraws/swiftui-agent-skill](https://github.com/twostraws/swiftui-agent-skill) | SwiftUI 开发规范与最佳实践 |
| `ios-application-dev` | [minimax-ai/skills](https://github.com/minimax-ai/skills) | iOS 应用开发指南，覆盖 UIKit / SnapKit / SwiftUI、HIG 与无障碍 |
| `sqlite-data-usage-guide` | [bitxeno/sqlite-data-skill](https://github.com/bitxeno/sqlite-data-skill) | SQLiteData（SwiftData 的 SQL 轻量替代）用法指南，含 CloudKit 同步 |

## Go 项目

适用于 Go 后端 / CLI 项目，包含 Git 工作流与代码审查类技能：

```bash
npx -y github:bitxeno/skills install go
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `go` | [spf13/go-skills](https://github.com/spf13/go-skills) | Go 开发规范与最佳实践 |

## Rust 项目

适用于把遗留代码库（C++ / Fortran / Java / Python / C / Shell）迁移到 Rust 的场景：

```bash
npx -y github:bitxeno/skills install rust
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `migrate-to-rust` | [google/skills](https://github.com/google/skills/tree/main/skills/developers/migrate-to-rust) | 克隆并分析遗留代码库，规划到 100% Safe Rust 的迁移，跟踪遥测与 PGO，产出报告与 HTML 信息图 |

## 逆向工程

适用于 iOS / Android 应用、前端 JS、二进制逆向及渗透测试、CTF 等安全研究场景，技能均来自 [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill)。

不同方向对应不同的 lock 文件，按需选择；`reverse-skill-router` 为公共路由入口（各方向均包含），按任务自动分发到对应方法论与工具链。

### iOS 逆向

```bash
npx -y github:bitxeno/skills install reverse-ios
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `mobile-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | iOS / 移动应用逆向 |

### Android 逆向

```bash
npx -y github:bitxeno/skills install reverse-android
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `apk-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | APK / Android 应用逆向分析 |

### Web 前端逆向

```bash
npx -y github:bitxeno/skills install reverse-web
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `js-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 前端 JS / 加密参数逆向 |

### 二进制逆向（通用）

```bash
npx -y github:bitxeno/skills install reverse-binary
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `ida-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | IDA Pro 二进制逆向（exe / dll / so / elf） |
| `radare2` | 同上 | radare2 命令行二进制逆向 |

## UI 设计

避免 "AI slop" 风格界面，生成有设计感的前端 UI。该分组默认安装到**全局**：

```bash
npx -y github:bitxeno/skills install ui-design
```

装到当前项目而非全局时加 `-p`：

```bash
npx -y github:bitxeno/skills install ui-design -p
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | 确定美学方向后产出生产级界面代码 |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 上线前按 Web Interface Guidelines 检查质量 |
| `better-ui` | [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | 设计工程细节：圆角、阴影、动画与微交互 |
| `better-typography` | 同上 | 字体选择与配对、字号比例、间距、换行与截断 |
| `better-colors` | 同上 | 配色系统：构建与命名调色板、色彩语义、对比度与主题 |
| `better-accessibility` | 同上 | 焦点态、键盘支持、ARIA、表单、屏幕阅读器与动效 |
| `better-layout` | 同上 | 布局结构、分组、对齐、阅读顺序与自适应断点 |
| `better-writing` | 同上 | UX 文案：从按钮标签到报错、设置与空状态 |

## App Icon 生成

纯文本视觉系统生成大胆、有个性的 App 图标，含构图规则、配色约束与小尺寸质量检查：

```bash
npx -y github:bitxeno/skills install icon
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `design-playful-app-icons` | [chunkithwang/design-playful-app-icons](https://github.com/chunkithwang/design-playful-app-icons) | 图标概念开发、生成提示词、评审迭代与 iOS / Android 交付 |
| `ip-as-logo` | [s1dashu/ip-as-logo-skill](https://github.com/s1dashu/ip-as-logo-skill) | 极简圆润的 IP 吉祥物 Logo 生成，含构图与配色约束 |

## 管理已安装的 Skill

```bash
# 列出已安装
npx -y skills list

# 更新到最新（重跑一次 skillpacks 即可，install 是幂等且会刷新的）
npx -y github:bitxeno/skills install ios

# 只看哪些技能有新版本（有更新时 exit 1，可用于 CI 门禁）
npx -y skills check

# 更新（逐个 skill）
npx -y skills update <skill-name>

# 移除
npx -y skills remove <skill-name> -y
```

> **注意**：`npx -y skills experimental_install` 只在技能**不存在**时安装，已装过会直接跳过、不会更新到最新；且它校验 lock 里的 `computedHash`，在 CI 环境（`CI` / `GITHUB_ACTIONS` 等变量存在）下默认 `--frozen-lockfile`，hash 不一致会报 `has changed since skills-lock.json was written` 并 exit 1。**日常更新请用 `skillpacks install`**，它走的是 `skills add`，会覆盖刷新。

> 单独添加某个 skill 也可以直接用 `npx skills add <repo> -s <skill> -p -y`，会自动写回项目的 `skills-lock.json`。

## 维护本仓库

新增/调整某个分组时，直接改 `bin/skillpacks.mjs` 里的 `PACKS` 表：

```js
rust: {
  desc: 'Rust 开发（遗留代码迁移到 Rust）',
  steps: [['google/skills', ['migrate-to-rust']]],
},
```

- `steps` 每项是 `[源仓库, [skill 名...]]`；skill 名写成空数组 `[]` 表示装该仓库全部 skill。
- 同一源仓库只写一条，多个 skill 会用一次 `skills add` 装完。
- 想让某分组默认装到全局，加 `global: true`（用户可用 `-p` 覆盖）。
- 改完 `npx -y github:bitxeno/skills list` 自查一遍即可，无需生成或维护任何 lock 文件。

新增来源前建议先确认 skill 名，避免写错（名字错会报 `No matching skills found`）：

```bash
npx -y skills@latest add google/skills -l    # 列出该仓库所有 skill 名
```

