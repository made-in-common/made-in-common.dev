import { parseArgs } from 'node:util'
import { org, projects } from '../shared/projects.ts'
import { createGitHub, permission, syncTeams } from './teams.ts'

const { values: flags, positionals: only } = parseArgs({
  allowPositionals: true,
  options: {
    apply: { type: 'boolean', default: false },
    prune: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

if (flags.help) {
  console.log(`Usage: pnpm sync-teams [--apply] [--prune] [repo...]

Creates a ${org}/<repo> team for each public repository in the ${org} organisation,
adds the maintainers listed in shared/projects.ts and gives the team the ${permission} role
on the repository. Without --apply, prints the changes without making them.

  --apply  make the changes
  --prune  remove team members who are not listed in shared/projects.ts
  repo     only sync these repositories

GITHUB_TOKEN needs to manage teams in ${org}, for example:
  gh auth refresh -s admin:org && export GITHUB_TOKEN=$(gh auth token)`)
  process.exit(0)
}

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('Set GITHUB_TOKEN to a token that can manage teams in the organisation. Run with --help for an example.')
  process.exit(1)
}

try {
  const changes = await syncTeams({
    github: createGitHub(token),
    sources: projects,
    apply: flags.apply,
    prune: flags.prune,
    only,
    log: line => console.log(line),
  })
  if (!changes) {
    console.log('Everything is in sync.')
  }
  else if (!flags.apply) {
    console.log(`\n${changes} change(s). Run with --apply to make them.`)
  }
}
catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
