export type Tone = 'ink' | 'signal'

export interface MarkShape {
  d: string
  tone: Tone
  /** Stroke width; when absent the shape is filled. */
  stroke?: number
}

/** Size of the square viewBox every mark is drawn in. */
export const MARK_SIZE = 120

type Corner = 0 | 1 | 2 | 3

function hash(input: string) {
  let h = 0x811C9DC5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function random(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`

function quarter(corner: Corner, r: number) {
  const s = MARK_SIZE
  switch (corner) {
    case 0: return `M0 0H${r}A${r} ${r} 0 0 1 0 ${r}Z`
    case 1: return `M${s} 0V${r}A${r} ${r} 0 0 1 ${s - r} 0Z`
    case 2: return `M${s} ${s}H${s - r}A${r} ${r} 0 0 1 ${s} ${s - r}Z`
    case 3: return `M0 ${s}V${s - r}A${r} ${r} 0 0 1 ${r} ${s}Z`
  }
}

function ring(corner: Corner, r: number) {
  const s = MARK_SIZE
  const cx = corner === 0 || corner === 3 ? 0 : s
  const cy = corner < 2 ? 0 : s
  const sx = cx === 0 ? 1 : -1
  const sy = cy === 0 ? 1 : -1
  return `M${cx + sx * r} ${cy}A${r} ${r} 0 0 ${sx * sy > 0 ? 1 : 0} ${cx} ${cy + sy * r}`
}

/**
 * Builds the geometric mark for a project: arcs and bars on a fixed module,
 * derived from the project name so it is stable across builds.
 */
export function createMark(name: string): MarkShape[] {
  const next = random(hash(name))
  const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)]!
  const corner = pick([0, 1, 2, 3] as const)
  const roll = next()
  const accent: [Tone, Tone] = roll < 0.45 ? ['signal', 'ink'] : roll < 0.85 ? ['ink', 'signal'] : ['ink', 'ink']
  const s = MARK_SIZE
  const w = pick([8, 12, 16])
  const gap = pick([4, 6, 8])
  const left = corner === 0 || corner === 3
  const top = corner < 2

  const bars = (count: number, vertical: boolean, fromStart: boolean, tone: Tone) =>
    Array.from({ length: count }, (_, i) => {
      const offset = fromStart ? i * (w + gap) : s - (i + 1) * (w + gap) + gap
      return { d: vertical ? rect(offset, 0, w, s) : rect(0, offset, s, w), tone }
    })

  switch (pick(['quarter-bars', 'quarter-stripes', 'half-bars', 'rings', 'circle-bars', 'two-quarters', 'overlap'] as const)) {
    case 'quarter-bars': {
      const count = 1 + Math.floor(next() * 4)
      return [
        { d: quarter(corner, s - count * (w + gap)), tone: accent[0] },
        ...bars(count, true, !left, accent[1]),
      ]
    }
    case 'quarter-stripes': {
      const count = 1 + Math.floor(next() * 4)
      return [
        { d: quarter(corner, s - count * (w + gap)), tone: accent[0] },
        ...bars(count, false, !top, accent[1]),
      ]
    }
    case 'half-bars': {
      const r = s / 2
      const half = [
        `M0 0H${s}A${r} ${r} 0 0 1 0 0Z`,
        `M${s} 0V${s}A${r} ${r} 0 0 1 ${s} 0Z`,
        `M${s} ${s}H0A${r} ${r} 0 0 1 ${s} ${s}Z`,
        `M0 ${s}V0A${r} ${r} 0 0 1 0 ${s}Z`,
      ][corner]!
      const count = 2 + Math.floor(next() * 2)
      const vertical = corner === 1 || corner === 3
      return [
        { d: half, tone: accent[0] },
        ...bars(count, vertical, corner === 1 || corner === 2, accent[1]),
      ]
    }
    case 'rings': {
      const stroke = pick([8, 12])
      const count = 3 + Math.floor(next() * 3)
      return Array.from({ length: count }, (_, i) => ({
        d: ring(corner, s - stroke / 2 - i * stroke * 2),
        tone: i === 0 ? accent[0] : 'ink',
        stroke,
      }))
    }
    case 'circle-bars': {
      const r = pick([20, 28, 36])
      const fits = Math.max(1, Math.floor((s - 2 * r) / (w + gap)))
      const count = Math.min(fits, 1 + Math.floor(next() * 3))
      const cx = left ? r : s - r
      const cy = top ? r : s - r
      const vertical = next() < 0.5
      return [
        { d: circle(cx, cy, r), tone: accent[0] },
        ...bars(count, vertical, vertical ? !left : !top, accent[1]),
      ]
    }
    case 'two-quarters': {
      const opposite = ((corner + 2) % 4) as Corner
      return [
        { d: quarter(corner, s / 2), tone: accent[0] },
        { d: quarter(opposite, s / 2), tone: accent[1] === accent[0] ? 'ink' : accent[1] },
        ...(next() < 0.5 ? bars(1, top !== left, !left, 'ink') : []),
      ]
    }
    case 'overlap': {
      const size = pick([60, 72, 84])
      const r = (s - size) + pick([0, 12])
      const x = left ? 0 : s - size
      const y = top ? 0 : s - size
      const cx = left ? size : s - size
      const cy = top ? size : s - size
      return [
        { d: rect(x, y, size, size), tone: accent[1] },
        { d: circle(cx, cy, Math.min(r, cx, s - cx, cy, s - cy)), tone: accent[0] === accent[1] ? 'signal' : accent[0] },
      ]
    }
  }
}

function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
}
