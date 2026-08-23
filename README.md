# skills

个人 Agent Skills 集合。每个分类分组（pack）对应 `locks/` 下的一份 `skills-lock.json` 文件，记录该分组包含的全部 skill（来源、路径、哈希）。使用 [skills CLI](https://github.com/vercel-labs/agent-skills) 的 `npx skills experimental_install` 一键恢复到项目（`.agents/skills/`）。

## 安装方式

1. 选择分组，把对应的 lock 文件复制为项目根目录的 `skills-lock.json`：

   ```bash
   cp locks/swift.skills-lock.json ./skills-lock.json
   ```

2. 在项目根目录执行恢复：

   ```bash
   npx -y skills experimental_install
   ```

`experimental_install` 读取项目根目录的 `skills-lock.json`，按来源分组把其中的 skill 全部安装到 `.agents/skills/`（项目级，多个 agent 通用）。重复执行会保持幂等。

> 若项目已有 `skills-lock.json`（例如已装过其他 skill），可手动把新分组的 `skills` 条目合并进去（同名 skill 以新分组为准），再执行 `experimental_install`。

可用分组及对应 lock 文件：

| 分组 | lock 文件 | 说明 |
| --- | --- | --- |
| swift | `locks/swift.skills-lock.json` | Swift / iOS / macOS 开发 |
| go | `locks/go.skills-lock.json` | Go 后端 / CLI 开发 |
| reverse-ios | `locks/reverse-ios.skills-lock.json` | iOS / 移动应用逆向 |
| reverse-android | `locks/reverse-android.skills-lock.json` | Android 应用逆向 |
| reverse-web | `locks/reverse-web.skills-lock.json` | Web 前端 / JS 逆向 |
| reverse-binary | `locks/reverse-binary.skills-lock.json` | 二进制逆向（IDA / radare2） |
| ui-design | 无（全局安装，见下） | 前端 UI 设计 |
| app-icon | `locks/app-icon.skills-lock.json` | App 图标生成 |

以下为各分组的具体安装命令与包含的 skill。

## Swift 项目

适用于 iOS / macOS 开发项目，包含 UI 开发规范、命令行构建、模拟器自动化、SQLiteData 用法等技能：

```bash
cp locks/swift.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
| --- | --- | --- |
| `swiftui-pro` | [twostraws/swiftui-agent-skill](https://github.com/twostraws/swiftui-agent-skill) | SwiftUI 开发规范与最佳实践 |
| `ios-application-dev` | [minimax-ai/skills](https://github.com/minimax-ai/skills) | iOS 应用开发指南，覆盖 UIKit / SnapKit / SwiftUI、HIG 与无障碍 |
| `sqlite-data-usage-guide` | [bitxeno/sqlite-data-skill](https://github.com/bitxeno/sqlite-data-skill) | SQLiteData（SwiftData 的 SQL 轻量替代）用法指南，含 CloudKit 同步 |

## Go 项目

适用于 Go 后端 / CLI 项目，包含 Git 工作流与代码审查类技能：

```bash
cp locks/go.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `go` | [spf13/go-skills](https://github.com/spf13/go-skills) | Go 开发规范与最佳实践 |

## 逆向工程

适用于 iOS / Android 应用、前端 JS、二进制逆向及渗透测试、CTF 等安全研究场景，技能均来自 [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill)。

不同方向对应不同的 lock 文件，按需选择；`reverse-skill-router` 为公共路由入口（各方向均包含），按任务自动分发到对应方法论与工具链。

### iOS 逆向

```bash
cp locks/reverse-ios.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `mobile-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | iOS / 移动应用逆向 |

### Android 逆向

```bash
cp locks/reverse-android.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `apk-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | APK / Android 应用逆向分析 |

### Web 前端逆向

```bash
cp locks/reverse-web.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `js-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 前端 JS / 加密参数逆向 |

### 二进制逆向（通用）

```bash
cp locks/reverse-binary.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `ida-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | IDA Pro 二进制逆向（exe / dll / so / elf） |
| `radare2` | 同上 | radare2 命令行二进制逆向 |

## UI 设计

避免 "AI slop" 风格界面，生成有设计感的前端 UI。该分组默认安装到**全局**（`experimental_install` 仅支持项目级恢复，因此使用 `skills add`）：

```bash
npx -y skills add yetone/native-feel-skill -g && \
npx -y skills add jakubkrehel/skills \
  -s better-ui -s better-typography -s better-colors \
  -s better-accessibility -s better-layout -s better-writing \
  -g -y
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
cp locks/app-icon.skills-lock.json ./skills-lock.json && npx -y skills experimental_install
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `design-playful-app-icons` | [chunkithwang/design-playful-app-icons](https://github.com/chunkithwang/design-playful-app-icons) | 图标概念开发、生成提示词、评审迭代与 iOS / Android 交付 |
| `ip-as-logo` | [s1dashu/ip-as-logo-skill](https://github.com/s1dashu/ip-as-logo-skill) | 极简圆润的 IP 吉祥物 Logo 生成，含构图与配色约束 |

## 管理已安装的 Skill

```bash
# 列出已安装
npx -y skills list

# 更新
npx -y skills update <skill-name>

# 移除
npx -y skills remove <skill-name> -y

# 从项目根目录的 skills-lock.json 恢复 / 重装
npx -y skills experimental_install
```

> 单独添加某个 skill 也可以直接用 `npx skills add <repo> -s <skill> -p -y`，会自动写回项目的 `skills-lock.json`。
