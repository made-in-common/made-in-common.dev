import type { Category, Project } from './projects'

export const sorts = ['stars', 'name', 'recent'] as const
export type Sort = typeof sorts[number]

export interface ProjectFilter {
  query: string
  category?: Category
  maintainer?: string
  sort: Sort
}

function matches(project: Project, query: string) {
  if (!query) {
    return true
  }
  const haystack = [
    project.name,
    project.description,
    project.npm,
    project.category,
    ...project.maintainers,
    ...project.topics,
  ].join(' ').toLowerCase()
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(term => haystack.includes(term))
}

const compare: Record<Sort, (a: Project, b: Project) => number> = {
  stars: (a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  recent: (a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? '') || a.name.localeCompare(b.name),
}

export function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  const maintainer = filter.maintainer?.toLowerCase()
  return projects
    .filter(project => !filter.category || project.category === filter.category)
    .filter(project => !maintainer || project.maintainers.some(handle => handle.toLowerCase() === maintainer))
    .filter(project => matches(project, filter.query.trim()))
    .sort(compare[filter.sort])
}
