import { expect, test } from '@playwright/test'

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
  expect(inlined).toContain('archivo-latin.woff2')

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
