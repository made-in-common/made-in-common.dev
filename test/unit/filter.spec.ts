import { describe, expect, it } from 'vitest'
import { filterProjects } from '../../shared/filter'
import type { Project } from '../../shared/projects'

function project(name: string, overrides: Partial<Project> = {}): Project {
  return {
    repo: `made-in-common/${name}`,
    name,
    url: `https://github.com/made-in-common/${name}`,
    category: 'Build',
    maintainers: ['danielroe', 'antfu'],
    topics: [],
    ...overrides,
  }
}

const projects = [
  project('alpha', { stars: 10, pushedAt: '2026-01-01T00:00:00Z', description: 'Inline critical CSS', category: 'Fonts & CSS' }),
  project('bravo', { stars: 300, pushedAt: '2026-03-01T00:00:00Z', maintainers: ['sxzz', 'antfu'] }),
  project('charlie', { stars: 30, pushedAt: '2026-04-01T00:00:00Z', topics: ['fonts'] }),
]

const names = (list: Project[]) => list.map(p => p.name)

describe('filterProjects', () => {
  it('should sort by stars, name or most recent push', () => {
    expect(names(filterProjects(projects, { query: '', sort: 'stars' }))).toEqual(['bravo', 'charlie', 'alpha'])
    expect(names(filterProjects(projects, { query: '', sort: 'name' }))).toEqual(['alpha', 'bravo', 'charlie'])
    expect(names(filterProjects(projects, { query: '', sort: 'recent' }))).toEqual(['charlie', 'bravo', 'alpha'])
  })

  it('should match every search term against name, description, maintainers and topics', () => {
    expect(names(filterProjects(projects, { query: 'critical', sort: 'name' }))).toEqual(['alpha'])
    expect(names(filterProjects(projects, { query: 'SXZZ', sort: 'name' }))).toEqual(['bravo'])
    expect(names(filterProjects(projects, { query: 'fonts', sort: 'name' }))).toEqual(['alpha', 'charlie'])
    expect(names(filterProjects(projects, { query: 'antfu fonts', sort: 'name' }))).toEqual(['alpha', 'charlie'])
    expect(names(filterProjects(projects, { query: 'nothing', sort: 'name' }))).toEqual([])
  })

  it('should filter by category and exact maintainer handle', () => {
    expect(names(filterProjects(projects, { query: '', category: 'Fonts & CSS', sort: 'name' }))).toEqual(['alpha'])
    expect(names(filterProjects(projects, { query: '', maintainer: 'Danielroe', sort: 'name' }))).toEqual(['alpha', 'charlie'])
    expect(names(filterProjects(projects, { query: '', maintainer: 'daniel', sort: 'name' }))).toEqual([])
  })
})
