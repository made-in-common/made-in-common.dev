import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition?.bind(document)
    if (!start) return
    Object.assign(window, { viewTransitions: 0 })
    document.startViewTransition = (...args: Parameters<typeof start>) => {
      Object.assign(window, { viewTransitions: (window as unknown as { viewTransitions: number }).viewTransitions + 1 })
      return start(...args)
    }
  })
})

function countViewTransitions(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as unknown as { viewTransitions?: number }).viewTransitions ?? 0)
}

function getLogoIntro(page: import('@playwright/test').Page) {
  return page.locator('.masthead__logo .logo__b').first().evaluate(circle => getComputedStyle(circle).animationName)
}

test('opens the logo with an intro and slides the cards when a filter changes', async ({ page }) => {
  await page.goto('/')
  expect(await getLogoIntro(page)).toMatch(/logo-intro/)
  await page.waitForLoadState('networkidle')

  await page.getByRole('radio', { name: /Fonts & CSS/ }).check({ force: true })
  await expect(page.getByRole('status')).toHaveText(/^\d+ of \d+ projects$/)
  expect(await countViewTransitions(page)).toBe(1)

  await page.getByRole('radio', { name: 'Name' }).check({ force: true })
  expect(await countViewTransitions(page)).toBe(2)

  await page.getByLabel('Find a project or maintainer').fill('fonts')
  expect(await countViewTransitions(page)).toBe(2)
})

test.describe('with reduced motion', () => {
  test('keeps the logo still and changes filters without a transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    expect(await getLogoIntro(page)).toBe('none')
    await page.waitForLoadState('networkidle')

    await page.getByRole('radio', { name: /Fonts & CSS/ }).check({ force: true })
    await expect(page.getByRole('status')).toHaveText(/^\d+ of \d+ projects$/)
    expect(await countViewTransitions(page)).toBe(0)
  })
})
