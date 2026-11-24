import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, posix, resolve } from 'node:path'
import { compileSheet } from 'beasties/compiler'
import { createProcessor } from 'beasties/runtime'
import { defineNuxtModule, useLogger } from 'nuxt/kit'

const STYLESHEET_RE = /<link rel="stylesheet" href="([^"]+)"[^>]*>/g

export default defineNuxtModule({
  meta: { name: 'inline-styles' },
  setup(_options, nuxt) {
    if (nuxt.options.dev) {
      return
    }

    const logger = useLogger('inline-styles')
    const { baseURL, buildAssetsDir } = nuxt.options.app
    const publicDir = resolve(nuxt.options.rootDir, nuxt.options.nitro.output?.dir || '.output', 'public')
    const assetsDir = join(publicDir, buildAssetsDir)
    const inlined = new Set<string>()
    let processor: ReturnType<typeof createProcessor> | undefined

    nuxt.hook('build:prerender:start', async () => {
      const files = (await readdir(assetsDir)).filter(file => file.endsWith('.css'))
      const sheets = await Promise.all(files.map(async (file) => {
        const href = posix.join(baseURL, buildAssetsDir, file)
        const sheet = compileSheet(await readFile(join(assetsDir, file), 'utf8'), { href })
        inlined.add(href)
        for (const warning of sheet.warnings) {
          logger.warn(warning)
        }
        return sheet
      }))
      processor = createProcessor(sheets, {
        inlineThreshold: Number.POSITIVE_INFINITY,
        logger: { warn: message => logger.warn(message) },
      })
    })

    nuxt.hook('build:prerender:route', async ({ fileName }) => {
      if (!processor || !fileName?.endsWith('.html')) {
        return
      }
      const file = join(publicDir, fileName)
      const html = await readFile(file, 'utf8')
      // A matching link stops Vite's preload helper from adding the inlined stylesheet again.
      // `disabled` alone is still fetched by Chromium's preload scanner, `type` alone by Firefox.
      const placeholders = Array.from(html.matchAll(STYLESHEET_RE), match => match[1]!)
        .filter(href => inlined.has(href))
        .map(href => `<link rel="stylesheet" href="${href}" type="text/plain" disabled>`)
        .join('')
      await writeFile(file, processor.process(html).replace('</head>', `${placeholders}</head>`))
    })
  },
})
