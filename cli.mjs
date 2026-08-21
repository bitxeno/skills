#!/usr/bin/env node
// 按分组（pack）一键安装 Agent Skills，底层调用 vercel-labs 的 skills CLI（npx -y skills add ...）
import { parseArgs } from 'node:util'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const step = (repo, skills = []) => ({ repo, skills })

const PACKS = {
  swift: {
    desc: 'Swift / iOS / macOS 开发',
    steps: [
      step('twostraws/swiftui-agent-skill', ['swiftui-pro']),
      step('minimax-ai/skills', ['ios-application-dev']),
      step('https://github.com/bitxeno/sqlite-data-skill'),
    ],
  },
  go: {
    desc: 'Go 后端 / CLI 开发',
    steps: [step('spf13/go-skills', ['go'])],
  },
  'reverse-ios': {
    desc: 'iOS / 移动应用逆向',
    steps: [step('zhaoxuya520/reverse-skill', ['reverse-skill-router', 'mobile-reverse'])],
  },
  'reverse-android': {
    desc: 'Android 应用逆向',
    steps: [step('zhaoxuya520/reverse-skill', ['reverse-skill-router', 'apk-reverse'])],
  },
  'reverse-web': {
    desc: 'Web 前端 / JS 逆向',
    steps: [step('zhaoxuya520/reverse-skill', ['reverse-skill-router', 'js-reverse'])],
  },
  'reverse-binary': {
    desc: '二进制逆向（IDA / radare2）',
    steps: [step('zhaoxuya520/reverse-skill', ['reverse-skill-router', 'ida-reverse', 'radare2'])],
  },
  'ui-design': {
    desc: '前端 UI 设计（默认装到全局）',
    steps: [
      step('yetone/native-feel-skill'),
      step('jakubkrehel/skills', [
        'better-ui',
        'better-typography',
        'better-colors',
        'better-accessibility',
        'better-layout',
        'better-writing',
      ]),
    ],
    global: true,
  },
  'app-icon': {
    desc: 'App 图标生成',
    steps: [
      step('https://github.com/chunkithwang/design-playful-app-icons', ['design-playful-app-icons']),
      step('https://github.com/s1dashu/ip-as-logo-skill'),
    ],
  },
}

const USAGE = `按分组一键安装 Agent Skills 到当前项目

用法
  npx github:bitxeno/skills <pack...> [options]

分组
${Object.entries(PACKS).map(([name, p]) => `  ${name.padEnd(16)} ${p.desc}`).join('\n')}

选项
  -l, --list       列出所有分组及包含的 skill
  -g, --global     安装到全局（覆盖 pack 默认值）
  -p, --project    安装到当前项目（覆盖 pack 默认值）
      --copy       复制安装而非符号链接
      --dir <path> 目标项目目录（默认当前目录）
      --dry-run    仅打印将执行的命令
  -h, --help       显示帮助

示例
  npx github:bitxeno/skills --list
  npx github:bitxeno/skills swift
  npx github:bitxeno/skills swift go
  npx github:bitxeno/skills reverse-ios --dir ./MyApp`

const c = (code, s) => (process.stdout.isTTY && !process.env.NO_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s)
const dim = (s) => c(2, s)
const cyan = (s) => c(36, s)
const green = (s) => c(32, s)
const red = (s) => c(31, s)

function listPacks() {
  for (const [name, p] of Object.entries(PACKS)) {
    console.log(cyan(name.padEnd(16)) + dim(p.global ? '(global)' : '') + ' ' + p.desc)
    for (const st of p.steps) {
      const skills = st.skills.length ? st.skills.join(', ') : '(全部)'
      console.log(dim(`  └ ${st.repo} › ${skills}`))
    }
  }
}

function buildArgs(pack, st, opts) {
  const args = ['-y', 'skills', 'add', st.repo]
  for (const s of st.skills) args.push('-s', s)
  const useGlobal = opts.global === true ? true : opts.project === true ? false : !!pack.global
  args.push(useGlobal ? '-g' : '-p')
  args.push('-y')
  if (opts.copy) args.push('--copy')
  return args
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      list: { type: 'boolean', short: 'l' },
      help: { type: 'boolean', short: 'h' },
      global: { type: 'boolean', short: 'g' },
      project: { type: 'boolean', short: 'p' },
      copy: { type: 'boolean' },
      dir: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  })

  if (values.help || (!positionals.length && !values.list)) {
    console.log(USAGE)
    return
  }
  if (values.list) {
    listPacks()
    return
  }

  const names = [...new Set(positionals)]
  for (const name of names) {
    if (!PACKS[name]) {
      console.error(red(`未知分组: ${name}`))
      console.error(dim(`可用分组: ${Object.keys(PACKS).join(', ')}`))
      process.exit(1)
    }
  }

  const opts = values
  if (opts.dir) {
    const r = spawnSync('test', ['-d', opts.dir], { shell: true })
    if (r.status !== 0) {
      console.error(red(`目录不存在: ${opts.dir}`))
      process.exit(1)
    }
  }

  console.log(dim(`目标目录: ${opts.dir || process.cwd()}\n`))

  for (const name of names) {
    const pack = PACKS[name]
    console.log(green(`▸ ${name}`) + dim(` — ${pack.desc}`))
    for (const st of pack.steps) {
      const args = buildArgs(pack, st, opts)
      const cmdStr = `npx ${args.join(' ')}`
      console.log(dim(`  $ ${cmdStr}`))
      if (opts['dry-run']) continue
      const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
        stdio: 'inherit',
        cwd: opts.dir,
      })
      if (r.status !== 0) {
        console.error(red(`\n✗ 安装失败：${st.repo}（exit ${r.status ?? r.error?.errno ?? '?'}）`))
        process.exit(r.status ?? 1)
      }
    }
    console.log()
  }

  console.log(green(`✓ 完成：${names.join(', ')}`) + dim(opts['dry-run'] ? '（dry-run，未实际执行）' : ''))
}

main()
