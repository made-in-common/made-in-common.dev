# made-in-common.dev

The website for [Made in Common](https://github.com/made-in-common): open source tools for the web, looked after together.

It is a fully static Nuxt site. The project list is read from the public repositories in the organisation at build time, along with each project's description, stars and last push. The maintainers of `made-in-common/<repo>` are the members of the organisation team with the same name as the repository.

## Setup

```bash
pnpm install
```

Set `GITHUB_TOKEN` to a token that can read organisation members. Production builds fail without it, or when project data cannot be read. Dev builds fall back to the list in `shared/projects.ts` when GitHub cannot be read. Tests always use that list and never fetch from GitHub. Set `SITE_DATA_OFFLINE=true` to do the same for any other build.

```bash
export GITHUB_TOKEN=$(gh auth token)
```

Outside CI, GitHub data is cached in `node_modules/.cache/site-data` for an hour. Set `SITE_DATA_CACHE=false` to fetch it again.

## Development

```bash
pnpm dev
```

## Content

- `shared/projects.ts`: the category and npm name of each project, matched by repository name. Projects not yet in the organisation are listed from here, with their maintainers.
- `content/*.md`: the about, principles and join copy
- `GOVERNANCE.md` and `CODE_OF_CONDUCT.md` in [`made-in-common/.github`](https://github.com/made-in-common/.github) are rendered at `/governance` and `/code-of-conduct`. A page and its footer link are left out until the file exists.
- `scripts/og.ts`: renders `public/og.png` (run `pnpm og` after changing the project list)

## Testing

```bash
pnpm lint          # eslint
pnpm test:types    # vue-tsc
pnpm test:unit     # vitest, node environment
pnpm test:nuxt     # vitest, nuxt environment
pnpm test:browser  # playwright, against the generated site
```

## Production

```bash
pnpm generate  # writes the static site to .output/public
pnpm preview   # serves it locally
```
