import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProjectCell from '~/components/ProjectCell.vue'
import type { Project } from '~~/shared/projects'

const project: Project = {
  repo: 'made-in-common/example',
  name: 'example',
  url: 'https://github.com/made-in-common/example',
  npm: '@made-in-common/example',
  description: 'An example project',
  category: 'Build',
  maintainers: ['danielroe', 'sxzz'],
  stars: 12345,
  pushedAt: '2026-11-03T10:00:00Z',
  topics: [],
}

describe('ProjectCell', () => {
  it('should link to the repository and npmx, and list maintainers by accessible name', async () => {
    const wrapper = await mountSuspended(ProjectCell, { props: { project } })

    expect(wrapper.get('h3 a').attributes('href')).toBe(project.url)
    expect(wrapper.get('.cell__meta a').attributes('href')).toBe('https://npmx.dev/package/@made-in-common/example')
    expect(wrapper.findAll('button.maintainer').map(button => button.text())).toEqual([
      'Show projects by danielroe',
      'Show projects by sxzz',
    ])
    expect(wrapper.text()).toContain('12,345 stars')
    expect(wrapper.text()).toContain('Nov 2026')
    expect(wrapper.text()).not.toContain('Looking for maintainers')
  })

  it('should mark a project with fewer than two maintainers as looking for maintainers', async () => {
    const wrapper = await mountSuspended(ProjectCell, { props: { project: { ...project, maintainers: ['danielroe'] } } })

    expect(wrapper.get('.cell__maintainers').text()).toContain('Looking for maintainers')
  })

  it('should mark the previewed maintainer', async () => {
    const wrapper = await mountSuspended(ProjectCell, { props: { project, preview: 'sxzz' } })

    expect(wrapper.findAll('button.maintainer').map(button => button.classes('maintainer--active'))).toEqual([false, true])
  })

  it('should emit preview and select for a maintainer', async () => {
    const onPreview = vi.fn()
    const onSelect = vi.fn()
    const wrapper = await mountSuspended(ProjectCell, { props: { project, onPreview, onSelect } })
    const button = wrapper.findAll('button.maintainer')[1]!

    await button.trigger('mouseenter')
    await button.trigger('click')
    await button.trigger('mouseleave')

    expect(onPreview.mock.calls).toEqual([['sxzz'], [undefined]])
    expect(onSelect.mock.calls).toEqual([['sxzz']])
  })
})
