import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function reloadWithFontDelay(page: Page, delay: number) {
  await page.route('**/*.woff2', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delay))
    await route.continue()
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)

  return page.evaluate(() => new Promise<{ shift: number, paint: number, font: number }>((resolve) => {
    let shift = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        shift += (entry as PerformanceEntry & { value: number }).value
      }
    }).observe({ type: 'layout-shift', buffered: true })
    setTimeout(() => resolve({
      shift,
      paint: performance.getEntriesByName('first-contentful-paint')[0]!.startTime,
      font: (performance.getEntriesByType('resource').find(entry => entry.name.endsWith('.woff2')) as PerformanceResourceTiming).responseEnd,
    }), 250)
  }))
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('lists every project with its maintainers', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Made in Common')
  await expect(page.getByRole('status')).toHaveText('11 projects')
  await expect(page.getByRole('article', { name: 'beasties' })).toContainText('danielroe')
})

test('filters by search, category and maintainer and keeps the filter in the URL', async ({ page }) => {
  const status = page.getByRole('status')

  await page.getByLabel('Find a project or maintainer').fill('fonts')
  await expect(status).toHaveText(/of 11 projects/)
  await expect(page).toHaveURL(/q=fonts/)

  await page.getByLabel('Find a project or maintainer').fill('no such project')
  await expect(page.getByText('No projects match these filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(status).toHaveText('11 projects')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByRole('radio', { name: /Fonts & CSS/ }).check({ force: true })
  await expect(status).toHaveText('3 of 11 projects')
  await page.getByRole('radio', { name: /All/ }).check({ force: true })

  const sxzz = page.getByRole('button', { name: 'Show projects by sxzz' }).first()
  await sxzz.focus()
  await expect(page.getByRole('article', { name: 'beasties' })).toHaveClass(/cell--dimmed/)
  await expect(page.getByRole('article', { name: 'bumpp' })).toHaveClass(/cell--highlighted/)

  await sxzz.click()
  const chip = page.getByRole('button', { name: 'Remove maintainer filter: sxzz' })
  await expect(chip).toBeFocused()
  await expect(page).toHaveURL(/maintainer=sxzz/)
  for (const article of await page.getByRole('article').all()) {
    await expect(article).toContainText('sxzz')
  }

  await chip.click()
  await expect(status).toHaveText('11 projects')
  await expect(chip).toBeHidden()
  await expect(page.getByText('Choose a name on any project')).toBeFocused()
})

test('restores filters from the URL', async ({ page }) => {
  await page.goto('/?category=Packages+%26+releases&sort=name')
  await expect(page.getByRole('status')).toHaveText('3 of 11 projects')
  await expect(page.getByRole('radio', { name: 'Name' })).toBeChecked()
  await expect(page.getByRole('article').first()).toHaveAccessibleName('bumpp')
})

test('inlines the stylesheets', async ({ page, request }) => {
  const html = await (await request.get('/')).text()
  const inlined = html.match(/<style>(.*?)<\/style>/s)?.[1]
  expect(inlined).toContain('.masthead')
  expect(inlined).toMatch(/@font-face\{font-family:Archivo;[^}]*\/_nuxt\/_fonts\/[\w-]+\.woff2/)

  const stylesheets: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'stylesheet') {
      stylesheets.push(request.url())
    }
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(stylesheets).toEqual([])
})

test('waits for the web font before the first paint', async ({ page }) => {
  const { paint, font, shift } = await reloadWithFontDelay(page, 250)
  expect(paint).toBeGreaterThanOrEqual(font)
  expect(shift).toBe(0)
})

test('paints with the fallback font after 500ms and keeps the layout stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { paint, font, shift } = await reloadWithFontDelay(page, 1500)
  expect(paint).toBeLessThan(font)
  expect(paint).toBeLessThan(1000)
  expect(shift).toBeLessThan(0.01)
})
