import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { addTemplate, defineNuxtModule, updateTemplates, useLogger } from 'nuxt/kit'
import { parseMarkdown } from 'comark'
import type { MarkdownDocument } from 'comark'
import type { DocSlug } from '../../shared/docs.ts'
import type { Project } from '../../shared/projects.ts'
import { projects } from '../../shared/projects.ts'
import { cached } from './cache.ts'
import { fetchDocs } from './docs.ts'
import { resolveProjects, resolveSponsors, toProject } from './github.ts'

const TEMPLATE = 'site-data.mjs'
const CACHE_TTL = 60 * 60 * 1000

interface GitHubData {
  projects: Project[]
  docs: Partial<Record<DocSlug, MarkdownDocument>>
  sponsors: string[]
}

export default defineNuxtModule({
  meta: { name: 'site-data' },
  setup(_options, nuxt) {
    const logger = useLogger('site-data')
    const contentDir = resolve(nuxt.options.rootDir, 'content')
    let github: Promise<{ data: GitHubData, savedAt: number }> | undefined

    async function fetchGitHub() {
      let complete = true
      const options = {
        token: process.env.GITHUB_TOKEN || process.env.NUXT_GITHUB_TOKEN,
        strict: !nuxt.options.dev && !nuxt.options.test,
        warn: (message: string) => logger.warn(message),
        onFailure: () => { complete = false },
      }
      const [resolved, docs] = await Promise.all([resolveProjects(options), fetchDocs(options)])
      const sponsors = await resolveSponsors(resolved.flatMap(project => project.maintainers), options)
      return { data: { projects: resolved, docs, sponsors }, complete }
    }

    async function loadGitHub() {
      if (nuxt.options._prepare) {
        return { data: { projects: projects.map(source => toProject(source)), docs: {}, sponsors: [] }, savedAt: Date.now() }
      }
      return cached<GitHubData>({
        file: resolve(nuxt.options.rootDir, 'node_modules/.cache/site-data/github.json'),
        key: await hashFiles([
          ...['cache.ts', 'docs.ts', 'github.ts', 'index.ts'].map(file => resolve(nuxt.options.rootDir, 'modules/site-data', file)),
          ...['docs.ts', 'projects.ts'].map(file => resolve(nuxt.options.rootDir, 'shared', file)),
        ]),
        ttl: CACHE_TTL,
        enabled: !process.env.CI && process.env.SITE_DATA_CACHE !== 'false',
        fetch: fetchGitHub,
        info: message => logger.info(message),
      })
    }

    addTemplate({
      filename: TEMPLATE,
      async getContents() {
        github ||= loadGitHub()
        const [{ data, savedAt }, content] = await Promise.all([github, readContent(contentDir)])
        return [
          `export const projects = ${JSON.stringify(data.projects)}`,
          `export const docs = ${JSON.stringify(data.docs)}`,
          `export const sponsors = ${JSON.stringify(data.sponsors)}`,
          `export const content = ${JSON.stringify(content)}`,
          `export const generatedAt = ${JSON.stringify(new Date(savedAt).toISOString())}`,
        ].join('\n')
      },
    })

    addTemplate({
      filename: TEMPLATE.replace(/\.mjs$/, '.d.mts'),
      write: true,
      getContents: () => [
        `import type { MarkdownDocument } from 'comark'`,
        `import type { Project } from '${resolve(nuxt.options.rootDir, 'shared/projects')}'`,
        `import type { DocSlug } from '${resolve(nuxt.options.rootDir, 'shared/docs')}'`,
        `export declare const projects: Project[]`,
        `export declare const docs: Partial<Record<DocSlug, MarkdownDocument>>`,
        `/** Maintainers with a GitHub Sponsors profile. */`,
        `export declare const sponsors: string[]`,
        `export declare const content: Record<string, MarkdownDocument>`,
        `export declare const generatedAt: string`,
      ].join('\n'),
    })

    nuxt.options.watch.push(contentDir)
    nuxt.hook('builder:watch', async (_event, path) => {
      if (resolve(nuxt.options.srcDir, path).startsWith(contentDir) || resolve(nuxt.options.rootDir, path).startsWith(contentDir)) {
        await updateTemplates({ filter: template => template.filename === TEMPLATE })
      }
    })
  },
})

async function hashFiles(files: string[]) {
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(await readFile(file))
  }
  return hash.digest('hex')
}

async function readContent(dir: string) {
  const files = (await readdir(dir)).filter(file => file.endsWith('.md')).sort()
  const entries = await Promise.all(files.map(async (file) => {
    const markdown = await readFile(join(dir, file), 'utf8')
    return [basename(file, '.md'), await parseMarkdown(markdown, { autoClose: false })] as const
  }))
  return Object.fromEntries(entries)
}
