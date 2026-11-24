import { describe, expect, it } from 'vitest'
import { createMark } from '../../shared/mark'
import { projects } from '../../shared/projects'

describe('createMark', () => {
  it('should return the same mark for the same name', () => {
    expect(createMark('beasties')).toEqual(createMark('beasties'))
  })

  it('should give every launch project a distinct mark', () => {
    const marks = projects.map(project => JSON.stringify(createMark(project.repo.split('/').pop()!)))
    expect(new Set(marks).size).toBe(projects.length)
  })

  it('should produce finite paths for any name', () => {
    const names = ['', 'a', 'your project', 'x'.repeat(200), ...Array.from({ length: 200 }, (_, i) => `project-${i}`)]
    for (const name of names) {
      const shapes = createMark(name)
      expect(shapes.length).toBeGreaterThan(0)
      for (const shape of shapes) {
        expect(shape.d).toMatch(/^M[\d\s.MHVAZahvz-]+$/)
        expect(shape.d).not.toMatch(/NaN|undefined|Infinity/)
      }
    }
  })
})
