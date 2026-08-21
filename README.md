# skills

个人 Agent Skills 集合，通过 [skills CLI](https://github.com/vercel-labs/agent-skills)（`npx skills`）一键安装到项目中。


## Swift 项目

适用于 iOS / macOS 开发项目，包含 UI 开发规范、命令行构建、模拟器自动化、SQLiteData 用法等技能：

```bash
npx skills add twostraws/swiftui-agent-skill --skill swiftui-pro -p -y  && \
npx skills add minimax-ai/skills --skill ios-application-dev -p -y && \
npx skills add https://github.com/bitxeno/sqlite-data-skill -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `swiftui-pro` | [twostraws/swiftui-agent-skill](https://github.com/twostraws/swiftui-agent-skill) | SwiftUI 开发规范与最佳实践 |
| `ios-application-dev` | [minimax-ai/skills](https://github.com/minimax-ai/skills) | iOS 应用开发指南，覆盖 UIKit / SnapKit / SwiftUI、HIG 与无障碍 |
| `sqlitedata-usage-guide` | [bitxeno/sqlite-data-skill](https://github.com/bitxeno/sqlite-data-skill) | SQLiteData（SwiftData 的 SQL 轻量替代）用法指南，含 CloudKit 同步 |

## Go 项目

适用于 Go 后端 / CLI 项目，包含 Git 工作流与代码审查类技能：

```bash
npx skills add spf13/go-skills --skill go -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `go` | [spf13/go-skills](https://github.com/spf13/go-skills) | Go 开发规范与最佳实践 |


## 逆向工程

适用于 iOS / Android 应用、前端 JS、二进制逆向及渗透测试、CTF 等安全研究场景，技能均来自 [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill)。

不同方向使用不同的安装命令，按需选择；`reverse-skill-router` 为公共路由入口（各方向均建议安装），按任务自动分发到对应方法论与工具链。

### iOS 逆向

```bash
npx skills add zhaoxuya520/reverse-skill \
  -s reverse-skill-router \
  -s mobile-reverse \
  -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `mobile-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | iOS / 移动应用逆向 |

### Android 逆向

```bash
npx skills add zhaoxuya520/reverse-skill \
  -s reverse-skill-router \
  -s apk-reverse \
  -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `apk-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | APK / Android 应用逆向分析 |

### Web 前端逆向

```bash
npx skills add zhaoxuya520/reverse-skill \
  -s reverse-skill-router \
  -s js-reverse \
  -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `js-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 前端 JS / 加密参数逆向 |

### 二进制逆向（通用）

```bash
npx skills add zhaoxuya520/reverse-skill \
  -s reverse-skill-router \
  -s ida-reverse \
  -s radare2 \
  -p -y
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `reverse-skill-router` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | 公共路由入口，自动分发到对应技能 |
| `ida-reverse` | [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) | IDA Pro 二进制逆向（exe / dll / so / elf） |
| `radare2` | 同上 | radare2 命令行二进制逆向 |

## UI 设计

避免 "AI slop" 风格界面，生成有设计感的前端 UI：

```bash
npx skills add yetone/native-feel-skill -g
```

| Skill | 来源 | 说明 |
|-------|------|------|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | 确定美学方向后产出生产级界面代码 |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 上线前按 Web Interface Guidelines 检查质量 |

## App Icon 生成

纯文本视觉系统生成大胆、有个性的 App 图标，含构图规则、配色约束与小尺寸质量检查：

```bash
npx skills add https://github.com/chunkithwang/design-playful-app-icons --skill design-playful-app-icons -p -y && \
npx skills add https://github.com/s1dashu/ip-as-logo-skill -p -y
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
```

> 默认以符号链接方式安装，便于通过 `update` 同步；如需独立副本可加 `--copy`。
