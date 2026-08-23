# skills

个人 Agent Skills 集合，通过 [skills CLI](https://github.com/vercel-labs/agent-skills)（`npx skills`）一键安装到项目中。

每个分类分组（pack）对应 `locks/` 下的一份 `skills-lock.json` 文件，记录该分组包含的全部 skill（来源、路径、哈希）。安装时把所选分组的条目合并进项目根目录的 `skills-lock.json`，再用 `npx skills experimental_install` 恢复到项目（`.agents/skills/`）。

## 快速安装（推荐）

在项目根目录按分组（pack）一键安装，无需记忆各仓库与参数：

```bash
# 查看所有分组及包含的 skill
npx github:bitxeno/skills --list

# 安装单个分组到当前项目
npx github:bitxeno/skills swift

# 一次安装多个分组
npx github:bitxeno/skills swift go
```

| 选项 | 说明 |
| --- | --- |
| `-l, --list` | 列出所有分组 |
| `-g, --global` / `-p, --project` | 仅对全局分组 `ui-design` 有效（覆盖默认安装位置） |
| `--dir <path>` | 指定目标项目目录 |
| `--dry-run` | 仅打印将执行的命令，不写文件 |

安装流程：

1. 把所选分组的 `locks/<pack>.skills-lock.json` 条目合并进目标项目根目录的 `skills-lock.json`（保留项目已有的其他条目，同名 skill 以分组为准）；
2. 在项目目录执行 `npx -y skills experimental_install`，恢复全部条目到 `.agents/skills/`。

可用分组：`swift`、`go`、`reverse-ios`、`reverse-android`、`reverse-web`、`reverse-binary`、`ui-design`、`app-icon`。

以下为各分组的手动安装方式，供参考（等价于把对应 lock 文件复制为项目根目录的 `skills-lock.json` 后执行 `npx -y skills experimental_install`）。

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

避免 "AI slop" 风格界面，生成有设计感的前端 UI。该分组默认安装到**全局**（`experimental_install` 仅支持项目级恢复，因此直接使用 `skills add`）：

```bash
npx skills add yetone/native-feel-skill -g && \
npx skills add jakubkrehel/skills \
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

# 从项目根目录的 skills-lock.json 恢复（experimental_install 安装的同样适用）
npx -y skills experimental_install
```

> 安装方式由 skills CLI 默认决定（符号链接 / 复制），本仓库 CLI 不再透传 `--copy`。
