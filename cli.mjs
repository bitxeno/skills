#!/usr/bin/env node
// 按分组（pack）一键安装 Agent Skills。
//
// 项目级分组：每个分组在 locks/ 下保存一份 skills-lock 文件（skills-lock.json 格式）。
//   安装时把所选分组的条目合并进目标项目根目录的 skills-lock.json，
//   再执行 `npx -y skills experimental_install` 恢复到项目（.agents/skills/）。
//
// 全局分组（ui-design）：experimental_install 仅支持项目级恢复，因此仍走
//   `npx -y skills add <repo> ... -g` 安装到全局。
import { parseArgs } from 'node:util'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const LOCKS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'locks')

const step = (repo, skills = []) => ({ repo, skills })

// 项目级分组：每个分组对应 locks/ 下的一份 skills-lock 文件
const PACKS = {
  swift: { desc: 'Swift / iOS / macOS 开发', lock: 'swift.skills-lock.json' },
  go: { desc: 'Go 后端 / CLI 开发', lock: 'go.skills-lock.json' },
  'reverse-ios': { desc: 'iOS / 移动应用逆向', lock: 'reverse-ios.skills-lock.json' },
  'reverse-android': { desc: 'Android 应用逆向', lock: 'reverse-android.skills-lock.json' },
  'reverse-web': { desc: 'Web 前端 / JS 逆向', lock: 'reverse-web.skills-lock.json' },
  'reverse-binary': { desc: '二进制逆向（IDA / radare2）', lock: 'reverse-binary.skills-lock.json' },
  'app-icon': { desc: 'App 图标生成', lock: 'app-icon.skills-lock.json' },
}

// 全局分组：experimental_install 不支持全局安装，仍用 skills add -g
const GLOBAL_PACKS = {
  'ui-design': {
    desc: '前端 UI 设计（默认装到全局）',
    global: true,
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
  },
}

const ALL_PACKS = { ...PACKS, ...GLOBAL_PACKS }

const USAGE = `按分组一键安装 Agent Skills

项目级分组：合并 locks/<pack>.skills-lock.json 到项目 skills-lock.json，
然后用 npx -y skills experimental_install 恢复到项目（.agents/skills/）。
全局分组（ui-design）：直接 npx -y skills add ... -g 安装到全局。

用法
  npx github:bitxeno/skills <pack...> [options]

分组
${Object.entries(ALL_PACKS)
  .map(([name, p]) => `  ${name.padEnd(16)} ${p.desc}`)
  .join('\n')}

选项
  -l, --list       列出所有分组及包含的 skill
  -g, --global     全局分组安装到全局（仅对 ui-design 有意义）
  -p, --project    全局分组安装到当前项目（仅对 ui-design 有意义）
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

// 通过 npx 运行时，npm exec 会向子进程泄漏 npm_config_package（外层包 spec）等
// npm exec 上下文变量，导致子进程里的 `npx -y skills ...` 跳过安装 skills 包而报
// "command not found"。这里清掉这些变量，让子进程的 npx 像从普通 shell 启动一样工作。
function cleanExecEnv() {
  const env = { ...process.env }
  for (const key of [
    'npm_config_package',
    'npm_command',
    'npm_lifecycle_event',
    'npm_lifecycle_script',
    'npm_lifecycle_hooks',
    'npm_package_json',
    'npm_package_lock',
    'npm_package_name',
    'npm_package_version',
  ]) {
    delete env[key]
  }
  return env
}

function readLockFile(pack) {
  const path = join(LOCKS_DIR, pack.lock)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(red(`✗ 缺少分组 lock 文件: ${path}`))
    process.exit(1)
  }
}

function listPacks() {
  for (const [name, p] of Object.entries(ALL_PACKS)) {
    console.log(cyan(name.padEnd(16)) + dim(p.global ? '(global)' : '') + ' ' + p.desc)
    if (p.lock) {
      const lock = readLockFile(p)
      for (const [skillName, entry] of Object.entries(lock.skills || {})) {
        console.log(dim(`  └ ${skillName} › ${entry.source}${entry.skillPath ? ' › ' + entry.skillPath : ''}`))
      }
    } else {
      for (const st of p.steps) {
        const skills = st.skills.length ? st.skills.join(', ') : '(全部)'
        console.log(dim(`  └ ${st.repo} › ${skills}`))
      }
    }
  }
}

// 把所选分组的 lock 条目合并进目标项目的 skills-lock.json（已存在则保留其他条目）
// write=false 时仅计算合并结果（dry-run），不落盘
function mergeIntoProjectLock(dir, names, write = true) {
  const targetPath = join(dir, 'skills-lock.json')
  let merged = { version: 1, skills: {} }
  if (existsSync(targetPath)) {
    try {
      const existing = JSON.parse(readFileSync(targetPath, 'utf8'))
      if (typeof existing.version === 'number' && existing.skills) merged = existing
    } catch {
      console.warn(dim(`! 已存在的 skills-lock.json 无法解析，将用新内容覆盖`))
    }
  }
  if (merged.version !== 1) merged.version = 1

  const sources = []
  for (const name of names) {
    const pack = PACKS[name]
    const lock = readLockFile(pack)
    let added = 0
    for (const [skillName, entry] of Object.entries(lock.skills || {})) {
      if (!merged.skills[skillName]) added++
      merged.skills[skillName] = entry
    }
    sources.push({ pack, added })
  }

  // 按名称排序，保证输出确定性
  const sorted = {}
  for (const key of Object.keys(merged.skills).sort()) sorted[key] = merged.skills[key]
  merged.skills = sorted

  if (write) writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n')
  return { targetPath, sources }
}

function installLockPacks(names, opts) {
  const { targetPath, sources } = mergeIntoProjectLock(opts.dir, names, !opts['dry-run'])
  console.log(dim(`已合并 ${sources.length} 个分组的 lock 条目 → ${targetPath}`))
  for (const { pack, added } of sources) {
    const lock = readLockFile(pack)
    const total = Object.keys(lock.skills || {}).length
    console.log(dim(`  ${pack.lock}: ${total} 个 skill（新增 ${added}）`))
  }

  const args = ['-y', 'skills', 'experimental_install']
  const cmdStr = `npx ${args.join(' ')}`
  console.log(dim(`  $ ${cmdStr}`))
  if (opts['dry-run']) return true

  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
    stdio: 'inherit',
    cwd: opts.dir,
    env: cleanExecEnv(),
  })
  if (r.status !== 0) {
    console.error(red(`\n✗ experimental_install 失败（exit ${r.status ?? r.error?.errno ?? '?'}）`))
    process.exit(r.status ?? 1)
  }
  return true
}

function installGlobalPacks(names, opts) {
  for (const name of names) {
    const pack = GLOBAL_PACKS[name]
    console.log(green(`▸ ${name}`) + dim(` — ${pack.desc}`))
    for (const st of pack.steps) {
      const args = ['-y', 'skills', 'add', st.repo]
      for (const s of st.skills) args.push('-s', s)
      const useGlobal = opts.global === true ? true : opts.project === true ? false : true
      args.push(useGlobal ? '-g' : '-p')
      args.push('-y')
      const cmdStr = `npx ${args.join(' ')}`
      console.log(dim(`  $ ${cmdStr}`))
      if (opts['dry-run']) continue
      const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
        stdio: 'inherit',
        cwd: opts.dir,
        env: cleanExecEnv(),
      })
      if (r.status !== 0) {
        console.error(red(`\n✗ 安装失败：${st.repo}（exit ${r.status ?? r.error?.errno ?? '?'}）`))
        process.exit(r.status ?? 1)
      }
    }
    console.log()
  }
  return true
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      list: { type: 'boolean', short: 'l' },
      help: { type: 'boolean', short: 'h' },
      global: { type: 'boolean', short: 'g' },
      project: { type: 'boolean', short: 'p' },
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
    if (!ALL_PACKS[name]) {
      console.error(red(`未知分组: ${name}`))
      console.error(dim(`可用分组: ${Object.keys(ALL_PACKS).join(', ')}`))
      process.exit(1)
    }
  }

  const opts = values
  opts.dir = opts.dir || process.cwd()
  if (!existsSync(opts.dir) || !statSync(opts.dir).isDirectory()) {
    console.error(red(`目录不存在: ${opts.dir}`))
    process.exit(1)
  }

  console.log(dim(`目标目录: ${opts.dir}\n`))

  const lockNames = names.filter((n) => PACKS[n])
  const globalNames = names.filter((n) => GLOBAL_PACKS[n])

  if (lockNames.length) {
    console.log(green(`▸ 项目级: ${lockNames.join(', ')}`))
    installLockPacks(lockNames, opts)
    console.log()
  }
  if (globalNames.length) {
    installGlobalPacks(globalNames, opts)
  }

  console.log(green(`✓ 完成：${names.join(', ')}`) + dim(opts['dry-run'] ? '（dry-run，未实际执行）' : ''))
}

main()
