import type { MarkdownDocument } from 'comark'
import { parseMarkdown } from 'comark'
import type { DocSlug } from '../../shared/docs.ts'
import { docs, docsRepo } from '../../shared/docs.ts'

type Node = MarkdownDocument['nodes'][number]

export interface FetchDocsOptions {
  /** Throw instead of warning when a document cannot be read. */
  strict: boolean
  warn: (message: string) => void
  /** Called when data could not be read and a fallback is used instead. */
  onFailure?: () => void
  fetch?: typeof globalThis.fetch
}

export async function fetchDocs(options: FetchDocsOptions): Promise<Partial<Record<DocSlug, MarkdownDocument>>> {
  const { strict, warn, fetch = globalThis.fetch } = options
  const entries = await Promise.all(docs.map(async (doc) => {
    const url = `https://raw.githubusercontent.com/${docsRepo}/HEAD/${doc.file}`
    try {
      const response = await fetch(url)
      if (response.status === 404) {
        warn(`${docsRepo} has no ${doc.file}, so /${doc.slug} is not rendered.`)
        return undefined
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      const parsed = await parseMarkdown(await response.text(), { autoClose: false })
      return [doc.slug, withTitle({ ...parsed, nodes: parsed.nodes.map(rewriteLinks) }, doc.title)] as const
    }
    catch (error) {
      if (strict) {
        throw new Error(`Could not fetch ${doc.file} from ${docsRepo}.`, { cause: error })
      }
      options.onFailure?.()
      warn(`Could not fetch ${doc.file} from ${docsRepo}; /${doc.slug} is not rendered.`)
      return undefined
    }
  }))
  return Object.fromEntries(entries.filter(entry => !!entry))
}

function withTitle(document: MarkdownDocument, title: string): MarkdownDocument {
  const first = document.nodes.find(node => typeof node !== 'string' || node.trim())
  if (Array.isArray(first) && first[0] === 'h1') {
    return document
  }
  return { ...document, nodes: [['h1', {}, title], ...document.nodes] }
}

function rewriteLinks(node: Node): Node {
  if (!Array.isArray(node)) {
    return node
  }
  const [tag, props, ...children] = node
  const next = { ...props }
  if (tag === 'a' && typeof props.href === 'string') {
    next.href = resolveHref(props.href)
  }
  if (tag === 'img' && typeof props.src === 'string' && isRelative(props.src)) {
    next.src = `https://raw.githubusercontent.com/${docsRepo}/HEAD/${props.src.replace(/^\.\//, '')}`
  }
  return [tag, next, ...children.map(rewriteLinks)] as Node
}

const isRelative = (href: string) => !/^([a-z][a-z\d+.-]*:|\/\/|#|\/)/i.test(href)

function resolveHref(href: string) {
  if (!isRelative(href)) {
    return href
  }
  const [path = '', hash] = href.replace(/^\.\//, '').split('#')
  const doc = docs.find(entry => entry.file.toLowerCase() === path.toLowerCase())
  if (doc) {
    return `/${doc.slug}${hash ? `#${hash}` : ''}`
  }
  return `https://github.com/${docsRepo}/blob/HEAD/${href.replace(/^\.\//, '')}`
}
