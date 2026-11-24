import type { Project, ProjectSource } from '../../shared/projects.ts'
import { excludedRepos, org, projects } from '../../shared/projects.ts'

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  pushed_at?: string
  topics?: string[]
  archived?: boolean
  fork?: boolean
  private?: boolean
}

export interface ResolveOptions {
  token?: string
  /** Throw instead of warning when GitHub data cannot be read. */
  strict: boolean
  warn: (message: string) => void
  /** Called when data could not be read and a fallback is used instead. */
  onFailure?: () => void
  fetch?: typeof globalThis.fetch
  sources?: ProjectSource[]
}

const repoName = (repo: string) => repo.split('/').pop() ?? repo

class GitHubError extends Error {
  status: number

  constructor(status: number, statusText: string) {
    super(`${status} ${statusText}`)
    this.status = status
  }
}

export async function resolveProjects(options: ResolveOptions): Promise<Project[]> {
  const { strict, warn, fetch = globalThis.fetch, sources = projects } = options
  const headers: Record<string, string> = {
    'accept': 'application/vnd.github+json',
    'user-agent': 'made-in-common.dev',
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`
  }

  async function get<T>(path: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, { headers })
    if (!response.ok) {
      throw new GitHubError(response.status, response.statusText)
    }
    return await response.json() as T
  }

  function fail(message: string, cause: unknown) {
    if (strict) {
      throw new Error(message, { cause })
    }
    options.onFailure?.()
    warn(message)
  }

  async function listOrgRepos() {
    const repos: GitHubRepo[] = []
    for (let page = 1; ; page++) {
      const batch = await get<GitHubRepo[]>(`/orgs/${org}/repos?type=public&per_page=100&page=${page}`)
      repos.push(...batch)
      if (batch.length < 100) {
        return repos.filter(repo => !repo.archived && !repo.fork && !repo.private && !excludedRepos.includes(repo.name))
      }
    }
  }

  async function readNpmName(repo: GitHubRepo) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${repo.full_name}/HEAD/package.json`)
      const pkg = response.ok ? await response.json() as { name?: string, private?: boolean } : {}
      return pkg.private ? undefined : pkg.name
    }
    catch {
      return undefined
    }
  }

  let orgRepos: GitHubRepo[] = []
  try {
    orgRepos = await listOrgRepos()
  }
  catch (error) {
    fail(`Could not list the ${org} repositories on GitHub. Set GITHUB_TOKEN if this is a rate limit.`, error)
  }

  const fromOrg = await Promise.all(orgRepos.map(async (repo) => {
    const source = sources.find(entry => repoName(entry.repo) === repo.name)
    let maintainers = source?.maintainers ?? []
    try {
      const members = await get<{ login: string }[]>(`/orgs/${org}/teams/${repo.name}/members?per_page=100`)
      if (members.length) {
        maintainers = members.map(member => member.login)
      }
      else {
        warn(`The ${org}/${repo.name} team has no members yet, so the maintainers in shared/projects.ts are listed.`)
      }
    }
    catch (error) {
      if (error instanceof GitHubError && error.status === 404) {
        warn(`${org} has no ${repo.name} team, so the maintainers in shared/projects.ts are listed. Run pnpm sync-teams to create it.`)
      }
      else {
        fail(`Could not read the members of the ${org}/${repo.name} team, which lists the maintainers of ${repo.full_name}. GITHUB_TOKEN needs read access to organisation members.`, error)
      }
    }
    if (maintainers.length < 2) {
      warn(`${repo.full_name} lists ${maintainers.length} maintainer(s).`)
    }
    if (!source) {
      warn(`${repo.full_name} has no entry in shared/projects.ts, so it is listed under Other.`)
    }
    return toProject({
      repo: repo.full_name,
      npm: source ? source.npm : await readNpmName(repo),
      category: source?.category ?? 'Other',
      maintainers,
    }, repo)
  }))

  const inOrg = new Set(orgRepos.map(repo => repo.name))
  const pending = await Promise.all(sources.filter(source => !inOrg.has(repoName(source.repo))).map(async (source) => {
    try {
      return toProject(source, await get<GitHubRepo>(`/repos/${source.repo}`))
    }
    catch (error) {
      fail(`Could not fetch ${source.repo} from GitHub. Set GITHUB_TOKEN if this is a rate limit.`, error)
      return toProject(source)
    }
  }))

  return [...fromOrg, ...pending]
}

export interface ResolveSponsorsOptions {
  token?: string
  /** Throw instead of warning when GitHub data cannot be read. */
  strict: boolean
  warn: (message: string) => void
  /** Called when data could not be read and a fallback is used instead. */
  onFailure?: () => void
  fetch?: typeof globalThis.fetch
}

/** Returns the logins that have a GitHub Sponsors profile, in the order given. */
export async function resolveSponsors(logins: string[], options: ResolveSponsorsOptions): Promise<string[]> {
  const { strict, warn, fetch = globalThis.fetch } = options
  const unique = [...new Set(logins)]
  if (!unique.length) {
    return []
  }
  const query = `{ ${unique.map((login, index) => `u${index}: repositoryOwner(login: ${JSON.stringify(login)}) { ... on Sponsorable { hasSponsorsListing } }`).join(' ')} }`
  try {
    if (!options.token) {
      throw new Error('GITHUB_TOKEN is not set')
    }
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${options.token}`, 'content-type': 'application/json', 'user-agent': 'made-in-common.dev' },
      body: JSON.stringify({ query }),
    })
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    const { data } = await response.json() as { data?: Record<string, { hasSponsorsListing?: boolean } | null> }
    return unique.filter((_login, index) => data?.[`u${index}`]?.hasSponsorsListing)
  }
  catch (error) {
    const message = 'Could not read GitHub Sponsors profiles, so sponsor links are left out.'
    if (strict) {
      throw new Error(message, { cause: error })
    }
    options.onFailure?.()
    warn(message)
    return []
  }
}

export function toProject(source: ProjectSource, repo?: GitHubRepo): Project {
  return {
    ...source,
    name: repo?.name ?? repoName(source.repo),
    url: repo?.html_url ?? `https://github.com/${source.repo}`,
    description: repo?.description?.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '') || undefined,
    stars: repo?.stargazers_count,
    pushedAt: repo?.pushed_at,
    topics: repo?.topics ?? [],
  }
}
