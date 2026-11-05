#!/usr/bin/env node
/**
 * skillpacks — 按分组（pack）一键安装 Agent Skills。
 *
 * 底层始终调用 vercel 的 skills CLI（`npx -y skills@latest add ...`），
 * 因此每次安装都会重新拉取上游最新内容，并把新 hash 写回项目的 skills-lock.json。
 *
 *   npx -y github:bitxeno/skills install ios
 *   npx -y github:bitxeno/skills install ios go
 *   npx -y github:bitxeno/skills list
 *
 * 设计要点：
 *  - CLI 只做「分组名 → (源仓库, skill 名列表)」的映射，不自己下载技能。
 *  - 映射来自 locks/*.json（本地检出优先，否则从 main 分支实时拉取），
 *    所以增删 skill 只需改 lock，不必重新发版。
 *  - lock 里的 computedHash 只作参考，不参与判断：上游更新后照样能装到最新。
 *  - 同一源仓库的多个 skill 合并成一次 `skills add`，只 clone 一次。
 */
import { spawn } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

/** lock 文件所在目录（本地/远端二选一） */
const DEFAULT_LOCK_BASE = 'https://raw.githubusercontent.com/bitxeno/skills/main/locks'
const LOCAL_LOCK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'locks')

/** 常用简称 → 实际分组名 */
const ALIASES = {
  ios: 'swift',
  mac: 'swift',
  macos: 'swift',
  android: 'reverse-android',
  web: 'reverse-web',
  bin: 'reverse-binary',
  binary: 'reverse-binary',
  icon: 'app-icon',
}

/** 不走 lock 文件的分组：直接写死源与 skill */
const BUILTIN_PACKS = {
  'ui-design': {
    desc: '前端 UI 设计（默认装到全局）',
    global: true,
    steps: [
      // [源仓库, skill 名列表；空数组表示装该仓库全部 skill]
      ['anthropics/skills', ['frontend-design']],
      ['vercel-labs/agent-skills', ['web-design-guidelines']],
      [
        'jakubkrehel/skills',
        [
          'better-ui',
          'better-typography',
          'better-colors',
          'better-accessibility',
          'better-layout',
          'better-writing',
        ],
      ],
      ['yetone/native-feel-skill', []],
    ],
  },
}

const c = (code, s) => (process.stdout.isTTY && !process.env.NO_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s)
const dim = (s) => c(2, s)
const bold = (s) => c(1, s)
const cyan = (s) => c(36, s)
const green = (s) => c(32, s)
const red = (s) => c(31, s)
const yellow = (s) => c(33, s)

const USAGE = `${bold('skillpacks')} — 按分组一键安装 Agent Skills（始终安装上游最新版）

用法
  npx -y github:bitxeno/skills <command> [packs...] [options]

命令
  install <pack...>   安装一个或多个分组到当前项目（默认）
  list                列出所有分组及其包含的 skill
  help                显示本帮助

分组简称
  ios / mac / macos   → swift              android → reverse-android
  web                 → reverse-web        bin     → reverse-binary
  icon                → app-icon

选项
  -p, --project   装到当前项目（默认）
  -g, --global    装到用户目录（覆盖分组的默认位置）
      --copy      复制文件而非符号链接
      --dir <path> 指定目标项目目录（默认当前目录）
      --dry-run   只打印将执行的命令，不实际安装
  -h, --help      显示本帮助

示例
  npx -y github:bitxeno/skills list
  npx -y github:bitxeno/skills install ios
  npx -y github:bitxeno/skills install ios go
  npx -y github:bitxeno/skills install reverse-web --dir ./MyApp
  npx -y github:bitxeno/skills install icon --dry-run
`

function log(msg = '') {
  process.stdout.write(msg + '\n')
}

/** 解析命令行 */
function parseArgv(argv) {
  const options = {
    command: 'install',
    packs: [],
    global: false,
    project: false,
    copy: false,
    dryRun: false,
    dir: null,
    help: false,
  }
  const commands = new Set(['install', 'add', 'list', 'ls', 'help'])

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') options.help = true
    else if (arg === '-g' || arg === '--global') options.global = true
    else if (arg === '-p' || arg === '--project') options.project = true
    else if (arg === '--copy') options.copy = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '-y' || arg === '--yes') {
      /* 本 CLI 始终非交互，忽略 */
    } else if (arg === '--dir') {
      const value = argv[++i]
      if (!value) fail('--dir 需要一个路径参数')
      options.dir = value
    } else if (arg.startsWith('-')) {
      fail(`未知选项：${arg}\n\n${USAGE}`)
    } else if (commands.has(arg) && options.packs.length === 0 && options.command === 'install') {
      options.command = arg
    } else {
      options.packs.push(arg)
    }
  }
  return options
}

function fail(message) {
  console.error(red(message))
  process.exit(2)
}

/** 读取本地 lock 目录里所有分组的名字 */
async function listLocalPacks() {
  if (!existsSync(LOCAL_LOCK_DIR)) return []
  const entries = await readdir(LOCAL_LOCK_DIR)
  return entries
    .filter((name) => name.endsWith('.skills-lock.json'))
    .map((name) => name.slice(0, -'.skills-lock.json'.length))
}

/**
 * 从远端枚举分组：本地没有 locks/ 时（例如只装了单个 bin 文件）用来支撑 list。
 * 优先 GitHub Contents API，失败则退回已知分组名，保证 list 永远有输出。
 */
async function listRemotePacks() {
  const api = process.env.SKILLPACKS_LIST_API
    || 'https://api.github.com/repos/bitxeno/skills/contents/locks'
  try {
    const res = await fetch(api, { headers: { Accept: 'application/vnd.github+json' } })
    if (res.ok) {
      const items = await res.json()
      if (Array.isArray(items)) {
        const names = items
          .map((item) => item?.name ?? '')
          .filter((name) => name.endsWith('.skills-lock.json'))
          .map((name) => name.slice(0, -'.skills-lock.json'.length))
        if (names.length > 0) return names
      }
    }
  } catch {
    /* 网络不可用时静默降级 */
  }
  return ['swift', 'go', 'reverse-ios', 'reverse-android', 'reverse-web', 'reverse-binary', 'app-icon']
}

/** 拉取某分组的 lock 内容：本地检出优先，否则走 raw URL */
async function loadLock(packName) {
  const file = join(LOCAL_LOCK_DIR, `${packName}.skills-lock.json`)
  if (existsSync(file)) return JSON.parse(await readFile(file, 'utf8'))

  const base = process.env.SKILLPACKS_LOCK_BASE || DEFAULT_LOCK_BASE
  const url = `${base.replace(/\/$/, '')}/${packName}.skills-lock.json`
  let res
  try {
    res = await fetch(url)
  } catch (error) {
    throw new Error(`无法连接 lock 源 ${url}：${error.message}`)
  }
  if (res.status === 404) throw new Error(`未知分组：${packName}`)
  if (!res.ok) throw new Error(`下载 lock 失败（${res.status}）：${url}`)
  return JSON.parse(await res.text())
}

/** 把 lock 转成 [(源仓库, [skill 名])]，同源合并 */
function lockToSteps(lock, packName) {
  const bySource = new Map()
  for (const [skill, entry] of Object.entries(lock.skills ?? {})) {
    if (entry.sourceType && entry.sourceType !== 'github' && entry.sourceType !== 'git') {
      log(yellow(`  ! 跳过 ${skill}：暂不支持 sourceType=${entry.sourceType}`))
      continue
    }
    if (!entry.source) {
      log(yellow(`  ! 跳过 ${skill}：lock 里缺少 source`))
      continue
    }
    bySource.set(entry.source, [...(bySource.get(entry.source) ?? []), skill])
  }
  if (bySource.size === 0) throw new Error(`分组 ${packName} 里没有可安装的 skill`)
  return [...bySource]
}

/** 解析分组 → { steps, global } */
async function resolvePack(rawName) {
  const name = ALIASES[rawName] ?? rawName
  const builtin = BUILTIN_PACKS[name]
  if (builtin) return { name, steps: builtin.steps, global: builtin.global === true, desc: builtin.desc }

  const lock = await loadLock(name)
  return { name, steps: lockToSteps(lock, name), global: false }
}

/** 组装单条 skills add 的 argv */
function buildAddArgs(source, skills, { global: isGlobal, copy }) {
  const args = ['-y', 'skills@latest', 'add', source]
  for (const skill of skills) args.push('-s', skill)
  args.push(isGlobal ? '-g' : '-p')
  if (copy) args.push('--copy')
  args.push('-y')
  return args
}

function runNpx(args, cwd) {
  return new Promise((resolvePromise) => {
    const child = spawn('npx', args, { stdio: 'inherit', cwd })
    child.on('error', (error) => {
      console.error(red(`无法启动 npx：${error.message}`))
      resolvePromise(1)
    })
    child.on('close', (code) => resolvePromise(code ?? 1))
  })
}

async function cmdList() {
  let localPacks = await listLocalPacks()
  if (localPacks.length === 0) localPacks = await listRemotePacks()
  const names = [...new Set([...Object.keys(BUILTIN_PACKS), ...localPacks])].sort()

  log(bold('可用分组') + dim(`（共 ${names.length} 个）`))
  log()
  for (const name of names) {
    let pack
    try {
      pack = await resolvePack(name)
    } catch (error) {
      log(`${cyan(name.padEnd(18))} ${red(error.message)}`)
      continue
    }
    const total = pack.steps.reduce((sum, [, skills]) => sum + skills.length, 0)
    const suffix = pack.global ? dim(' (默认全局)') : ''
    log(`${cyan(name.padEnd(18))}${suffix} ${dim(pack.desc ?? '')}`)
    for (const [source, skills] of pack.steps) {
      const label = skills.length ? skills.join(', ') : '(全部)'
      log(dim(`  └ ${source} › ${label}`))
    }
    log(dim(`  ${pack.steps.length} 个来源 / ${total} 个 skill`))
  }

  const aliases = Object.entries(ALIASES)
    .map(([alias, target]) => `${alias}→${target}`)
    .join('  ')
  log()
  log(dim(`简称：${aliases}`))
}

async function cmdInstall(options) {
  if (options.packs.length === 0) fail(`请指定至少一个分组。\n\n${USAGE}`)

  const cwd = options.dir ? resolve(options.dir) : process.cwd()
  if (options.dir && !existsSync(cwd)) fail(`目标目录不存在：${cwd}`)

  let failed = 0
  let totalCommands = 0

  for (const rawName of options.packs) {
    let pack
    try {
      pack = await resolvePack(rawName)
    } catch (error) {
      console.error(red(`✗ ${rawName}: ${error.message}`))
      failed++
      continue
    }

    const isGlobal = options.global || (pack.global && !options.project)
    const scope = isGlobal ? '全局' : '当前项目'
    log()
    log(`${bold(cyan(pack.name))} ${dim(`→ ${scope}${cwd !== process.cwd() ? ` · ${cwd}` : ''}`)}`)

    for (const [source, skills] of pack.steps) {
      const args = buildAddArgs(source, skills, { global: isGlobal, copy: options.copy })
      totalCommands++
      log(`  ${dim('$')} npx ${args.join(' ')}`)
      if (options.dryRun) continue

      const code = await runNpx(args, cwd)
      if (code !== 0) {
        console.error(red(`  ✗ 安装失败：${source}（exit ${code}）`))
        failed++
      } else {
        log(`  ${green('✓')} ${dim(source)}`)
      }
    }
  }

  log()
  if (options.dryRun) {
    log(dim(`dry-run：共 ${totalCommands} 条命令，未执行任何安装。`))
    return 0
  }
  if (failed > 0) {
    log(red(`完成，但有 ${failed} 项失败。`))
    return 1
  }
  log(green('✓ 全部完成') + dim('  技能已安装到最新版本'))
  return 0
}

async function main() {
  const options = parseArgv(process.argv.slice(2))

  if (options.help || options.command === 'help') {
    log(USAGE)
    return 0
  }
  if (options.command === 'list' || options.command === 'ls') {
    await cmdList()
    return 0
  }
  return cmdInstall(options)
}

main()
  .then((code) => {
    process.exitCode = code ?? 0
  })
  .catch((error) => {
    console.error(red(error?.stack ?? String(error)))
    process.exitCode = 1
  })
