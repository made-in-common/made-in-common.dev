import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

interface Entry<T> {
  key: string
  savedAt: number
  data: T
}

export interface CacheOptions<T> {
  file: string
  /** Identifies what the data was fetched with. An entry saved under another key is ignored. */
  key: string
  /** How long a saved entry is used instead of fetching, in milliseconds. */
  ttl: number
  /** Whether a saved entry within `ttl` is used instead of fetching. */
  enabled: boolean
  /** Fetches the data. Only `complete` results are saved. */
  fetch: () => Promise<{ data: T, complete: boolean }>
  info: (message: string) => void
  now?: () => number
}

/**
 * Returns the saved entry while it is within `ttl`, and otherwise fetches and saves.
 * When a fetch is incomplete, the last saved entry is returned in its place, whatever its age.
 */
export async function cached<T>(options: CacheOptions<T>): Promise<{ data: T, savedAt: number }> {
  const now = options.now?.() ?? Date.now()
  const entry = await read<T>(options.file, options.key)
  if (entry && options.enabled && now - entry.savedAt < options.ttl) {
    options.info(`Using GitHub data fetched ${age(now - entry.savedAt)} ago. Set SITE_DATA_CACHE=false to fetch it again.`)
    return { data: entry.data, savedAt: entry.savedAt }
  }
  const { data, complete } = await options.fetch()
  if (complete) {
    await mkdir(dirname(options.file), { recursive: true })
    await writeFile(options.file, JSON.stringify({ key: options.key, savedAt: now, data } satisfies Entry<T>))
    return { data, savedAt: now }
  }
  if (entry) {
    options.info(`Using GitHub data fetched ${age(now - entry.savedAt)} ago in place of the incomplete result.`)
    return { data: entry.data, savedAt: entry.savedAt }
  }
  return { data, savedAt: now }
}

async function read<T>(file: string, key: string): Promise<Entry<T> | undefined> {
  try {
    const entry = JSON.parse(await readFile(file, 'utf8')) as Entry<T>
    return entry.key === key ? entry : undefined
  }
  catch {
    return undefined
  }
}

function age(ms: number) {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) {
    return 'less than a minute'
  }
  if (minutes < 90) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  const hours = Math.round(minutes / 60)
  return hours < 48 ? `${hours} hours` : `${Math.round(hours / 24)} days`
}
