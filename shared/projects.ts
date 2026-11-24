export const categories = [
  'Build',
  'Packages & releases',
  'Config & runtime',
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
   * GitHub handles of the people who maintain the project. Used until the
   * repository is in the organisation, after which the members of the
   * organisation team named after the repository are used instead.
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
  { repo: 'danielroe/beasties', npm: 'beasties', category: 'Fonts & CSS', maintainers: ['danielroe', 'alan-agius4'] },
  { repo: 'danielroe/forges', npm: 'forges', category: 'APIs & types', maintainers: ['danielroe', 'serhalp', 'trueberryless', 'oritwoen'] },
  { repo: 'danielroe/unifont', npm: 'unifont', category: 'Fonts & CSS', maintainers: ['danielroe', 'florian-lefebvre'] },
  { repo: 'antfu-collective/ni', npm: '@antfu/ni', category: 'Packages & releases', maintainers: ['antfu', 'sxzz'] },
  { repo: 'antfu-collective/taze', npm: 'taze', category: 'Packages & releases', maintainers: ['antfu', 'Perdolique', 'SukkaW'] },
  { repo: 'antfu-collective/bumpp', npm: 'bumpp', category: 'Packages & releases', maintainers: ['antfu', 'sxzz'] },
  { repo: 'antfu-collective/unconfig', npm: 'unconfig', category: 'Config & runtime', maintainers: ['sxzz', 'antfu'] },
  { repo: 'antfu-collective/vite-node', npm: 'vite-node', category: 'Config & runtime', maintainers: ['sxzz', 'antfu'] },
  { repo: 'antfu-collective/tsdown-stale-guard', npm: 'tsdown-stale-guard', category: 'Build', maintainers: ['antfu', 'sxzz'] },
]
