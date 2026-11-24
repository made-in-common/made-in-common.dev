import { describe, expect, it } from 'vitest'
import { getLoopFrame, LOOP_DURATION } from '../../shared/logo'

describe('getLoopFrame', () => {
  it('should start and end on the resting logo', () => {
    const rest = { a: { cx: 40, r: 40 }, b: { cx: 80, r: 40 } }
    expect(getLoopFrame(0)).toEqual(rest)
    expect(getLoopFrame(LOOP_DURATION)).toEqual(rest)
    expect(getLoopFrame(LOOP_DURATION * 3)).toEqual(rest)
  })

  it('should shrink one circle inside the other halfway through each swap', () => {
    for (const [progress, small, large] of [[0.25, 'b', 'a'], [0.75, 'a', 'b']] as const) {
      const frame = getLoopFrame(LOOP_DURATION * progress)
      expect(frame[small].r).toBe(20)
      expect(frame[large].r).toBe(40)
      expect(Math.abs(frame[small].cx - frame[large].cx) + frame[small].r).toBeLessThanOrEqual(frame[large].r)
    }
  })

  it('should swap the circles in the middle of the loop', () => {
    expect(getLoopFrame(LOOP_DURATION / 2)).toEqual({ a: { cx: 80, r: 40 }, b: { cx: 40, r: 40 } })
  })

  it('should move smoothly without jumps', () => {
    let previous = getLoopFrame(0)
    for (let elapsed = 10; elapsed <= LOOP_DURATION; elapsed += 10) {
      const frame = getLoopFrame(elapsed)
      for (const key of ['a', 'b'] as const) {
        expect(Math.abs(frame[key].cx - previous[key].cx)).toBeLessThan(2)
        expect(Math.abs(frame[key].r - previous[key].r)).toBeLessThan(2)
      }
      previous = frame
    }
  })

  it('should handle negative and fractional times', () => {
    expect(getLoopFrame(-LOOP_DURATION / 2)).toEqual(getLoopFrame(LOOP_DURATION / 2))
    expect(Number.isFinite(getLoopFrame(1234.567).a.cx)).toBe(true)
  })
})
