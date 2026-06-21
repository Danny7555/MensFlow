type Level = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function getLevel(): Level {
  const env = (process.env.LOG_LEVEL || '').toLowerCase() as Level
  if (LOG_LEVELS[env] !== undefined) return env
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const currentLevel = getLevel()

function shouldLog(level: Level): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function fmt(level: Level, message: string, meta?: unknown): string {
  const ts = new Date().toISOString()
  const extra = meta !== undefined ? ' ' + JSON.stringify(meta) : ''
  return `[${ts}] [${level.toUpperCase()}] ${message}${extra}`
}

export const logger = {
  debug: (message: string, meta?: unknown) =>
    shouldLog('debug') && console.debug(fmt('debug', message, meta)),
  info: (message: string, meta?: unknown) =>
    shouldLog('info') && console.log(fmt('info', message, meta)),
  warn: (message: string, meta?: unknown) =>
    shouldLog('warn') && console.warn(fmt('warn', message, meta)),
  error: (message: string, meta?: unknown) =>
    shouldLog('error') && console.error(fmt('error', message, meta)),
}
