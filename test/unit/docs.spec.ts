import { describe, expect, it, vi } from 'vitest'
import { fetchDocs } from '../../modules/site-data/docs.ts'

function fakeRaw(files: Record<string, string>, status = 404) {
  return vi.fn(async (input: string | URL | Request) => {
    const file = String(input).split('/HEAD/')[1]!
    return file in files
      ? new Response(files[file])
      : new Response('', { status, statusText: status === 404 ? 'Not Found' : 'Server Error' })
  }) as unknown as typeof fetch
}

describe('fetchDocs', () => {
  it('renders documents from the .github repository and rewrites relative links', async () => {
    const fetch = fakeRaw({
      'GOVERNANCE.md': '# Governance\n\nSee the [code of conduct](./CODE_OF_CONDUCT.md#reporting), [security](SECURITY.md) and [the site](https://made-in-common.dev).',
      'CODE_OF_CONDUCT.md': 'Be kind.',
    })

    const docs = await fetchDocs({ strict: true, warn: vi.fn(), fetch })

    expect(docs.governance?.nodes).toEqual([
      ['h1', { id: 'governance' }, 'Governance'],
      ['p', {}, 'See the ', ['a', { href: '/code-of-conduct#reporting' }, 'code of conduct'], ', ', ['a', { href: 'https://github.com/made-in-common/.github/blob/HEAD/SECURITY.md' }, 'security'], ' and ', ['a', { href: 'https://made-in-common.dev' }, 'the site'], '.'],
    ])
    expect(docs['code-of-conduct']?.nodes[0]).toEqual(['h1', {}, 'Code of conduct'])
  })

  it('leaves out documents that do not exist yet', async () => {
    const warn = vi.fn()

    const docs = await fetchDocs({ strict: true, warn, fetch: fakeRaw({ 'GOVERNANCE.md': '# Governance' }) })

    expect(Object.keys(docs)).toEqual(['governance'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CODE_OF_CONDUCT.md'))
  })

  it('fails a strict build when GitHub cannot be reached', async () => {
    await expect(fetchDocs({ strict: true, warn: vi.fn(), fetch: fakeRaw({}, 500) })).rejects.toThrow('Could not fetch')
  })
})
