import type { ProjectSource } from '../shared/projects.ts'
import { excludedRepos, org } from '../shared/projects.ts'

export const permission = 'maintain'
const roleRank = ['pull', 'triage', 'push', 'maintain', 'admin']

export class GitHubError extends Error {
  status: number

  constructor(method: string, path: string, status: number, message: string) {
    super(`${method} ${path}: ${status} ${message}`)
    this.status = status
  }
}

export type GitHub = <T = unknown>(method: string, path: string, body?: unknown, accept?: string) => Promise<T>

export function createGitHub(token: string, fetch = globalThis.fetch): GitHub {
  return async (method, path, body, accept = 'application/vnd.github+json') => {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        'accept': accept,
        'authorization': `Bearer ${token}`,
        'user-agent': 'made-in-common.dev',
        ...body ? { 'content-type': 'application/json' } : {},
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const { message } = await response.json().catch(() => ({})) as { message?: string }
      throw new GitHubError(method, path, response.status, message ?? response.statusText)
    }
    return response.status === 204 ? undefined as never : await response.json()
  }
}

export interface SyncTeamsOptions {
  github: GitHub
  sources: ProjectSource[]
  /** Make the changes rather than only reporting them. */
  apply: boolean
  /** Remove team members who are not listed in `sources`. */
  prune: boolean
  /** Only sync these repositories. */
  only: string[]
  log: (line: string) => void
}

/**
 * Creates a team named after each public repository in the organisation, adds the maintainers
 * listed in `sources` and gives the team the maintain role on its repository.
 * Returns the number of changes made, or that would be made without `apply`.
 */
export async function syncTeams({ github, sources, apply, prune, only, log }: SyncTeamsOptions): Promise<number> {
  async function orNull<T>(request: Promise<T>): Promise<T | null> {
    try {
      return await request
    }
    catch (error) {
      if (error instanceof GitHubError && error.status === 404) {
        return null
      }
      throw error
    }
  }

  const repos: { name: string, archived: boolean, fork: boolean }[] = []
  for (let page = 1; ; page++) {
    const batch = await github<typeof repos>('GET', `/orgs/${org}/repos?type=public&per_page=100&page=${page}`)
    repos.push(...batch)
    if (batch.length < 100) {
      break
    }
  }
  const selected = repos.filter(repo => !repo.archived && !repo.fork && !excludedRepos.includes(repo.name) && (!only.length || only.includes(repo.name)))
  const unknown = only.filter(name => !selected.some(repo => repo.name === name))
  if (unknown.length) {
    throw new Error(`Not a public, active repository in ${org}: ${unknown.join(', ')}`)
  }

  const { login: viewer } = await github<{ login: string }>('GET', '/user')
  const lower = (login: string) => login.toLowerCase()
  let changes = 0

  async function change(description: string, run: () => Promise<unknown>) {
    changes++
    log(`  ${apply ? '' : 'would '}${description}`)
    if (apply) {
      await run()
    }
  }

  for (const repo of selected) {
    log(`${org}/${repo.name}`)
    const source = sources.find(entry => entry.repo.split('/').pop() === repo.name)
    if (!source) {
      log('  skipped: no entry in shared/projects.ts')
      continue
    }
    const wanted = new Set(source.maintainers.map(lower))

    let team = await orNull(github<{ slug: string }>('GET', `/orgs/${org}/teams/${repo.name}`))
    let members: string[]
    let invited: string[] = []
    if (!team) {
      await change(`create team ${repo.name}`, async () => {
        team = await github<{ slug: string }>('POST', `/orgs/${org}/teams`, {
          name: repo.name,
          description: `Maintainers of ${org}/${repo.name}`,
          privacy: 'closed',
        })
        if (!wanted.has(lower(viewer))) {
          await github('DELETE', `/orgs/${org}/teams/${team.slug}/memberships/${viewer}`)
        }
      })
      members = wanted.has(lower(viewer)) ? [viewer] : []
    }
    else {
      members = (await github<{ login: string }[]>('GET', `/orgs/${org}/teams/${team.slug}/members?per_page=100`)).map(member => member.login)
      invited = (await github<{ login: string | null }[]>('GET', `/orgs/${org}/teams/${team.slug}/invitations?per_page=100`)).flatMap(invite => invite.login ?? [])
    }
    const slug = () => team?.slug ?? repo.name

    const present = new Set([...members, ...invited].map(lower))
    for (const login of source.maintainers.filter(login => !present.has(lower(login)))) {
      await change(`add ${login}`, () => github('PUT', `/orgs/${org}/teams/${slug()}/memberships/${login}`, { role: 'member' }))
    }
    for (const login of invited.filter(login => wanted.has(lower(login)))) {
      log(`  ${login} has not accepted the invitation yet`)
    }
    for (const login of members.filter(login => !wanted.has(lower(login)))) {
      if (prune) {
        await change(`remove ${login}`, () => github('DELETE', `/orgs/${org}/teams/${slug()}/memberships/${login}`))
      }
      else {
        log(`  ${login} is in the team but not in shared/projects.ts (use --prune to remove)`)
      }
    }

    const access = team && await orNull(github<{ role_name: string }>('GET', `/orgs/${org}/teams/${slug()}/repos/${org}/${repo.name}`, undefined, 'application/vnd.github.v3.repository+json'))
    if (!access || roleRank.indexOf(access.role_name) < roleRank.indexOf(permission)) {
      await change(`give the team the ${permission} role on ${org}/${repo.name}`, () => github('PUT', `/orgs/${org}/teams/${slug()}/repos/${org}/${repo.name}`, { permission }))
    }
  }

  return changes
}
