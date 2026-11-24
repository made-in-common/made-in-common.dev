const INVALID_NAME_CHARACTER_RE = /[^\w-]/g

let current: ViewTransition | undefined

/**
 * Runs a change to the project filters inside a view transition, so the cards slide to their new places.
 * Resolves once the page shows the change, which is the right moment to move focus.
 */
export async function startFilterTransition(update: () => void): Promise<void> {
  if (!canAnimate()) {
    update()
    await nextTick()
    return
  }

  const root = document.documentElement
  root.dataset.transition = 'filter'
  document.addEventListener('click', passClickThrough, { capture: true })
  const transition = document.startViewTransition(async () => {
    update()
    await nextTick()
  })
  current = transition
  transition.ready.catch(() => {})
  transition.finished.catch(() => {}).finally(() => {
    if (current !== transition) return
    current = undefined
    delete root.dataset.transition
    document.removeEventListener('click', passClickThrough, { capture: true })
  })
  await transition.updateCallbackDone.catch(() => {})
}

/** Returns a `view-transition-name` that is a valid identifier for any project name. */
export function getProjectTransitionName(name: string) {
  return `project-${name.replace(INVALID_NAME_CHARACTER_RE, '-')}`
}

/**
 * While a view transition runs, the browser sends every click to `<html>`, so a quick second click
 * would be lost. Finish the transition at once and hand the click to whatever is under the pointer.
 */
function passClickThrough(event: MouseEvent) {
  const root = document.documentElement
  if (!current || event.target !== root) return

  event.preventDefault()
  event.stopImmediatePropagation()
  current.skipTransition()
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(':not(svg, svg *)')
  if (target && target !== root) target.click()
}

function canAnimate() {
  return import.meta.client
    && typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
