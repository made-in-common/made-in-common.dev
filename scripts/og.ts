import { readFile, writeFile } from 'node:fs/promises'
import { Renderer } from '@takumi-rs/core'
import { fromHtml } from '@takumi-rs/helpers/html'
import { createMark, MARK_SIZE } from '../shared/mark.ts'
import { projects } from '../shared/projects.ts'

const paper = '#f4f4f1'
const ink = '#0a0a0a'
const signal = '#d40a14'

function markSvg(name: string) {
  const paths = createMark(name).map((shape) => {
    const colour = shape.tone === 'signal' ? signal : ink
    return shape.stroke
      ? `<path d="${shape.d}" fill="none" stroke="${colour}" stroke-width="${shape.stroke}"/>`
      : `<path d="${shape.d}" fill="${colour}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_SIZE} ${MARK_SIZE}">${paths}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

const logo = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><circle cx="40" cy="40" r="40" fill="${ink}"/><circle cx="80" cy="40" r="40" fill="${ink}"/><path d="M60 5.36A40 40 0 0 1 60 74.64A40 40 0 0 1 60 5.36Z" fill="${signal}"/></svg>`,
).toString('base64')}`

const cells = projects.slice(0, 9).map(project => `
  <div style="display:flex;flex-direction:column;justify-content:space-between;width:180px;height:210px;padding:24px;border-left:2px solid ${ink};border-top:2px solid ${ink}">
    <img src="${markSvg(project.repo.split('/')[1]!)}" width="72" height="72" />
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${project.repo.split('/')[1]}</div>
  </div>`).join('')

const html = `
<div style="display:flex;width:1200px;height:630px;background:${paper};color:${ink};font-family:Archivo">
  <div style="display:flex;flex-direction:column;justify-content:space-between;width:660px;padding:56px">
    <img src="${logo}" width="96" height="64" />
    <div style="display:flex;flex-direction:column">
      <div style="font-size:124px;font-weight:800;line-height:0.88;letter-spacing:-0.04em">Made in</div>
      <div style="font-size:124px;font-weight:800;line-height:0.88;letter-spacing:-0.04em">Common</div>
      <div style="margin-top:32px;font-size:32px;line-height:1.3;max-width:520px">Open source tools for the web, looked after together.</div>
    </div>
  </div>
  <div style="display:flex;flex-wrap:wrap;align-content:flex-start;width:540px;margin-top:-2px">${cells}</div>
</div>`

const { node, css } = fromHtml(html)
const font = await readFile(new URL('../public/fonts/archivo-latin.woff2', import.meta.url))
const png = await new Renderer().render(node, {
  width: 1200,
  height: 630,
  stylesheets: css,
  fonts: [{ name: 'Archivo', data: font }],
})
await writeFile(new URL('../public/og.png', import.meta.url), png)
