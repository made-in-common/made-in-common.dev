import { describe, expect, it } from 'vitest'
import type { GitHub } from '../../scripts/teams.ts'
import { GitHubError, syncTeams } from '../../scripts/teams.ts'
import type { ProjectSource } from '../../shared/projects.ts'

const sources: ProjectSource[] = [
  { repo: 'made-in-common/beasties', category: 'Fonts & CSS', maintainers: ['danielroe', 'alan-agius4'] },
  { repo: 'made-in-common/forges', category: 'APIs & types', maintainers: ['danielroe', 'serhalp'] },
]

function fakeGitHub(routes: Record<string, unknown>, viewer = 'danielroe') {
  const writes: string[] = []
  const github: GitHub = async <T>(method: string, path: string, body?: unknown) => {
    const key = `${method} ${path.replace(/\?.*$/, '')}`
    if (method !== 'GET') {
      writes.push(body ? `${key} ${JSON.stringify(body)}` : key)
      return (method === 'POST' ? { slug: (body as { name: string }).name } : undefined) as T
    }
    if (key === 'GET /user') {
      return { login: viewer } as T
    }
    if (key in routes) {
      return routes[key] as T
    }
    throw new GitHubError(method, path, 404, 'Not Found')
  }
  return { github, writes }
}

const orgRepos = {
  'GET /orgs/made-in-common/repos': [
    { name: 'beasties', archived: false, fork: false },
    { name: 'forges', archived: false, fork: false },
    { name: '.github', archived: false, fork: false },
    { name: 'old', archived: true, fork: false },
  ],
}

const options = { sources, apply: true, prune: false, only: [], log: () => {} }

describe('syncTeams', () => {
  it('creates a missing team with the listed maintainers and the maintain role', async () => {
    const { github, writes } = fakeGitHub(orgRepos)

    await syncTeams({ ...options, github, only: ['beasties'] })

    expect(writes).toEqual([
      'POST /orgs/made-in-common/teams {"name":"beasties","description":"Maintainers of made-in-common/beasties","privacy":"closed"}',
      'PUT /orgs/made-in-common/teams/beasties/memberships/alan-agius4 {"role":"member"}',
      'PUT /orgs/made-in-common/teams/beasties/repos/made-in-common/beasties {"permission":"maintain"}',
    ])
  })

  it('removes the token owner from a team it creates when they are not a listed maintainer', async () => {
    const { github, writes } = fakeGitHub(orgRepos, 'someone-else')

    await syncTeams({ ...options, github, only: ['beasties'] })

    expect(writes).toContain('DELETE /orgs/made-in-common/teams/beasties/memberships/someone-else')
    expect(writes).toContain('PUT /orgs/made-in-common/teams/beasties/memberships/danielroe {"role":"member"}')
  })

  it('leaves invited maintainers, keeps higher roles and only removes unlisted members with prune', async () => {
    const routes = {
      ...orgRepos,
      'GET /orgs/made-in-common/teams/forges': { slug: 'forges' },
      'GET /orgs/made-in-common/teams/forges/members': [{ login: 'DanielRoe' }, { login: 'former' }],
      'GET /orgs/made-in-common/teams/forges/invitations': [{ login: 'serhalp' }],
      'GET /orgs/made-in-common/teams/forges/repos/made-in-common/forges': { role_name: 'admin' },
    }

    const kept = fakeGitHub(routes)
    await syncTeams({ ...options, github: kept.github, only: ['forges'] })
    expect(kept.writes).toEqual([])

    const pruned = fakeGitHub(routes)
    await syncTeams({ ...options, github: pruned.github, only: ['forges'], prune: true })
    expect(pruned.writes).toEqual(['DELETE /orgs/made-in-common/teams/forges/memberships/former'])
  })

  it('raises a lower repository role to maintain', async () => {
    const { github, writes } = fakeGitHub({
      ...orgRepos,
      'GET /orgs/made-in-common/teams/forges': { slug: 'forges' },
      'GET /orgs/made-in-common/teams/forges/members': [{ login: 'danielroe' }, { login: 'serhalp' }],
      'GET /orgs/made-in-common/teams/forges/invitations': [],
      'GET /orgs/made-in-common/teams/forges/repos/made-in-common/forges': { role_name: 'push' },
    })

    await syncTeams({ ...options, github, only: ['forges'] })

    expect(writes).toEqual(['PUT /orgs/made-in-common/teams/forges/repos/made-in-common/forges {"permission":"maintain"}'])
  })

  it('only reports changes without apply', async () => {
    const { github, writes } = fakeGitHub(orgRepos)
    const lines: string[] = []

    const changes = await syncTeams({ ...options, github, apply: false, log: line => lines.push(line) })

    expect(writes).toEqual([])
    expect(changes).toBe(6)
    expect(lines).toContain('  would create team forges')
  })

  it('rejects repositories that are not public and active in the organisation', async () => {
    const { github } = fakeGitHub(orgRepos)

    await expect(syncTeams({ ...options, github, only: ['old', 'beasties'] })).rejects.toThrow('made-in-common: old')
  })
})
