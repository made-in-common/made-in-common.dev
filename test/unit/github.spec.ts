import { describe, expect, it, vi } from 'vitest'
import { resolveProjects, resolveSponsors } from '../../modules/site-data/github.ts'
import type { ProjectSource } from '../../shared/projects.ts'

const sources: ProjectSource[] = [
  { repo: 'danielroe/beasties', npm: 'beasties', category: 'Fonts & CSS', maintainers: ['danielroe'] },
  { repo: 'antfu-collective/taze', npm: 'taze', category: 'Packages & releases', maintainers: ['antfu', 'sxzz'] },
]

function repo(fullName: string, extra: Record<string, unknown> = {}) {
  const name = fullName.split('/')[1]
  return { name, full_name: fullName, html_url: `https://github.com/${fullName}`, description: `${name} description`, stargazers_count: 1, ...extra }
}

function fakeGitHub(routes: Record<string, unknown>) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input).replace('https://api.github.com', '').replace('https://raw.githubusercontent.com', 'raw:')
    const path = url.replace(/[?&](type|per_page|page)=[^&]*/g, '')
    return path in routes
      ? new Response(JSON.stringify(routes[path]))
      : new Response('{}', { status: 404, statusText: 'Not Found' })
  }) as unknown as typeof fetch
}

describe('resolveSponsors', () => {
  it('returns each maintainer with a GitHub Sponsors profile once', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect(String(init?.body)).toContain('u0: repositoryOwner(login: \\"antfu\\")')
      return new Response(JSON.stringify({ data: { u0: { hasSponsorsListing: true }, u1: { hasSponsorsListing: false }, u2: null } }))
    }) as unknown as typeof globalThis.fetch

    const sponsors = await resolveSponsors(['antfu', 'sxzz', 'antfu', 'ghost'], { token: 't', strict: true, warn: vi.fn(), fetch })

    expect(sponsors).toEqual(['antfu'])
  })

  it('leaves sponsors out with a warning when GitHub cannot be read outside a strict build', async () => {
    const warn = vi.fn()

    expect(await resolveSponsors(['antfu'], { strict: false, warn })).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('resolveProjects', () => {
  it('takes org repositories from the organisation and maintainers from the matching team', async () => {
    const fetch = fakeGitHub({
      '/orgs/made-in-common/repos': [
        repo('made-in-common/beasties'),
        repo('made-in-common/new-tool'),
        repo('made-in-common/.github'),
        repo('made-in-common/old', { archived: true }),
      ],
      '/orgs/made-in-common/teams/beasties/members': [{ login: 'danielroe' }, { login: 'alan-agius4' }],
      '/orgs/made-in-common/teams/new-tool/members': [{ login: 'a' }, { login: 'b' }],
      'raw:/made-in-common/new-tool/HEAD/package.json': { name: 'new-tool' },
      '/repos/antfu-collective/taze': repo('antfu-collective/taze'),
    })
    const warn = vi.fn()

    const result = await resolveProjects({ strict: true, warn, fetch, sources })

    expect(result.map(project => [project.repo, project.category, project.npm, project.maintainers])).toEqual([
      ['made-in-common/beasties', 'Fonts & CSS', 'beasties', ['danielroe', 'alan-agius4']],
      ['made-in-common/new-tool', 'Other', 'new-tool', ['a', 'b']],
      ['antfu-collective/taze', 'Packages & releases', 'taze', ['antfu', 'sxzz']],
    ])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('made-in-common/new-tool has no entry'))
  })

  it('fails a strict build when a team cannot be read', async () => {
    const fetch = fakeGitHub({ '/orgs/made-in-common/repos': [repo('made-in-common/beasties')] })

    await expect(resolveProjects({ strict: true, warn: vi.fn(), fetch, sources: [] }))
      .rejects.toThrow('made-in-common/beasties team')
  })

  it('falls back to the listed maintainers when a team cannot be read outside a strict build', async () => {
    const fetch = fakeGitHub({ '/orgs/made-in-common/repos': [repo('made-in-common/taze')] })

    const [taze] = await resolveProjects({ strict: false, warn: vi.fn(), fetch, sources })

    expect(taze?.maintainers).toEqual(['antfu', 'sxzz'])
  })
})
