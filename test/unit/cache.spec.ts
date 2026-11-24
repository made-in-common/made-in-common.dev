import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached } from '../../modules/site-data/cache.ts'

const HOUR = 60 * 60 * 1000

describe('cached', () => {
  let dir: string
  let file: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'site-data-'))
    file = join(dir, 'nested/github.json')
  })

  afterEach(() => rm(dir, { recursive: true }))

  function options(overrides: Partial<Parameters<typeof cached<string>>[0]> = {}) {
    return { file, key: 'a', ttl: HOUR, enabled: true, info: vi.fn(), now: () => 0, fetch: vi.fn(async () => ({ data: 'fresh', complete: true })), ...overrides }
  }

  it('should reuse a saved entry until it is older than the ttl', async () => {
    await cached(options({ fetch: async () => ({ data: 'first', complete: true }) }))

    const within = options({ now: () => HOUR - 1 })
    expect(await cached(within)).toEqual({ data: 'first', savedAt: 0 })
    expect(within.fetch).not.toHaveBeenCalled()

    expect(await cached(options({ now: () => HOUR }))).toEqual({ data: 'fresh', savedAt: HOUR })
  })

  it.each([
    ['the key differs', { key: 'b' }],
    ['the cache is disabled', { enabled: false }],
  ])('should fetch again when %s', async (_name, overrides) => {
    await cached(options({ fetch: async () => ({ data: 'first', complete: true }) }))

    expect((await cached(options(overrides))).data).toBe('fresh')
  })

  it('should not save an incomplete result, and should prefer the last saved entry to it', async () => {
    const incomplete = async () => ({ data: 'fallback', complete: false })

    expect((await cached(options({ fetch: incomplete }))).data).toBe('fallback')
    expect((await cached(options())).data).toBe('fresh')
    expect(await cached(options({ fetch: incomplete, now: () => 2 * HOUR }))).toEqual({ data: 'fresh', savedAt: 0 })
  })
})
