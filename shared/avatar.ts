const GITHUB_AVATARS = 'https://avatars.githubusercontent.com'

/**
 * Image attributes for a GitHub avatar displayed at `size` CSS pixels.
 * With `optimise`, the images are requested through Vercel Image Optimization.
 */
export function avatar(login: string, size: number, optimise = false) {
  const source = `${GITHUB_AVATARS}/${login}`
  const url = (width: number) => optimise
    ? `/_vercel/image?url=${encodeURIComponent(`${source}?s=${size * 2}`)}&w=${width}&q=75`
    : `${source}?s=${width}`

  return {
    src: url(size * 2),
    srcset: `${url(size)} 1x, ${url(size * 2)} 2x`,
    width: size,
    height: size,
  }
}
