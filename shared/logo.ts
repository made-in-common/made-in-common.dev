/** Length of one loading loop in milliseconds: the circles swap places and swap back. */
export const LOOP_DURATION = 2800

const LEFT = 40
const RIGHT = 80
const RADIUS = 40
const SMALL_RADIUS = 20

/**
 * Keyframes as `[progress, value]` pairs. Each segment eases in and out on its own, so the circles
 * rest between moves. On the way over, one circle shrinks inside the other and leaves a red dot.
 */
const KEYFRAMES = {
  a: {
    cx: [[0, LEFT], [0.12, LEFT], [0.38, RIGHT], [0.62, RIGHT], [0.88, LEFT], [1, LEFT]],
    r: [[0, RADIUS], [0.62, RADIUS], [0.75, SMALL_RADIUS], [0.88, RADIUS], [1, RADIUS]],
  },
  b: {
    cx: [[0, RIGHT], [0.12, RIGHT], [0.38, LEFT], [0.62, LEFT], [0.88, RIGHT], [1, RIGHT]],
    r: [[0, RADIUS], [0.12, RADIUS], [0.25, SMALL_RADIUS], [0.38, RADIUS], [1, RADIUS]],
  },
} satisfies Record<'a' | 'b', Record<'cx' | 'r', Keyframe[]>>

/** Returns the centre and radius of both logo circles at `elapsed` milliseconds into the loop. */
export function getLoopFrame(elapsed: number): Record<'a' | 'b', Circle> {
  const progress = (((elapsed % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION) / LOOP_DURATION
  return {
    a: { cx: interpolate(KEYFRAMES.a.cx, progress), r: interpolate(KEYFRAMES.a.r, progress) },
    b: { cx: interpolate(KEYFRAMES.b.cx, progress), r: interpolate(KEYFRAMES.b.r, progress) },
  }
}

function interpolate(keyframes: Keyframe[], progress: number) {
  for (let index = 1; index < keyframes.length; index++) {
    const [end, to] = keyframes[index]!
    const [start, from] = keyframes[index - 1]!
    if (progress <= end) {
      const local = end === start ? 1 : (progress - start) / (end - start)
      return from + (to - from) * easeInOut(local)
    }
  }
  return keyframes.at(-1)![1]
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

type Keyframe = [progress: number, value: number]

interface Circle {
  cx: number
  r: number
}
