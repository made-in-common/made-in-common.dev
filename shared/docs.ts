import { org } from './projects.ts'

/** Repository the organisation documents are read from. */
export const docsRepo = `${org}/.github`

/** Organisation documents rendered as pages, read from the root of `docsRepo`. */
export const docs = [
  { slug: 'governance', file: 'GOVERNANCE.md', title: 'Governance' },
  { slug: 'code-of-conduct', file: 'CODE_OF_CONDUCT.md', title: 'Code of conduct' },
] as const

export type DocSlug = typeof docs[number]['slug']
