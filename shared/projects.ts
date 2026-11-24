export const categories = [
  'Build',
  'Packages & releases',
  'Config & runtime',
  'CLI & terminal',
  'Fonts & CSS',
  'APIs & types',
  'Other',
] as const

export type Category = typeof categories[number]

/** GitHub organisation whose public repositories make up the project list. */
export const org = 'made-in-common'

/** Repositories in the organisation that are not projects. */
export const excludedRepos = ['.github', 'made-in-common.dev']

export interface ProjectSource {
  /** GitHub repository as `owner/name`. */
  repo: string
  /** npm package name, if the project is published there. */
  npm?: string
  category: Category
  /**
   * GitHub handles of the people who maintain the project. For repositories in
   * the organisation, `pnpm sync-teams` adds them to the team named after the
   * repository, and the site lists that team's members once it has any.
   */
  maintainers: string[]
}

export interface Project extends ProjectSource {
  name: string
  url: string
  description?: string
  stars?: number
  /** ISO date of the most recent push to the default branch. */
  pushedAt?: string
  topics: string[]
}

/**
 * Category and npm name for each project, matched to organisation repositories
 * by repository name. Entries whose repository is not yet in the organisation
 * are listed as they are.
 */
export const projects: ProjectSource[] = [
  { repo: 'made-in-common/beasties', npm: 'beasties', category: 'Fonts & CSS', maintainers: ['danielroe', 'alan-agius4'] },
  { repo: 'made-in-common/forges', npm: 'forges', category: 'APIs & types', maintainers: ['danielroe', 'serhalp', 'trueberryless', 'oritwoen'] },
  { repo: 'made-in-common/unifont', npm: 'unifont', category: 'Fonts & CSS', maintainers: ['danielroe', 'florian-lefebvre'] },
  { repo: 'made-in-common/fontaine', npm: 'fontaine', category: 'Fonts & CSS', maintainers: ['danielroe', 'gioboa'] },
  { repo: 'made-in-common/clickable-path', npm: 'clickable-path', category: 'CLI & terminal', maintainers: ['danielroe'] },
  { repo: 'antfu-collective/ni', npm: '@antfu/ni', category: 'Packages & releases', maintainers: ['antfu', 'sxzz'] },
  { repo: 'antfu-collective/taze', npm: 'taze', category: 'Packages & releases', maintainers: ['antfu', 'Perdolique', 'SukkaW'] },
  { repo: 'antfu-collective/bumpp', npm: 'bumpp', category: 'Packages & releases', maintainers: ['antfu', 'sxzz'] },
  { repo: 'antfu-collective/unconfig', npm: 'unconfig', category: 'Config & runtime', maintainers: ['sxzz', 'antfu'] },
  { repo: 'antfu-collective/vite-node', npm: 'vite-node', category: 'Config & runtime', maintainers: ['sxzz', 'antfu'] },
  { repo: 'antfu-collective/tsdown-stale-guard', npm: 'tsdown-stale-guard', category: 'Build', maintainers: ['antfu', 'sxzz'] },
]
