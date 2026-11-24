<script setup lang="ts">
import { getLoopFrame } from '~~/shared/logo'

const props = defineProps<{
  /** Opens from a dot into the logo once, when the logo first appears. */
  intro?: boolean
  /** Loops the circles while something is loading. */
  loop?: boolean
}>()

const clipId = useId()
const svg = useTemplateRef<SVGSVGElement>('svg')

let frame: number | undefined

function stopLoop() {
  if (frame !== undefined) cancelAnimationFrame(frame)
  frame = undefined
}

function startLoop() {
  const circles = svg.value?.querySelectorAll<SVGCircleElement>('[data-circle]')
  if (!circles || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const start = performance.now()
  const tick = (now: number) => {
    const { a, b } = getLoopFrame(now - start)
    for (const circle of circles) {
      const { cx, r } = circle.dataset.circle === 'a' ? a : b
      circle.setAttribute('cx', String(cx))
      circle.setAttribute('r', String(r))
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  watch(() => props.loop, (loop) => {
    stopLoop()
    if (loop) startLoop()
  }, { immediate: true })
})

onBeforeUnmount(stopLoop)
</script>

<template>
  <svg
    ref="svg"
    class="logo"
    :class="{ 'logo--intro': props.intro }"
    viewBox="0 0 120 80"
    width="120"
    height="80"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <clipPath :id="clipId">
        <circle
          data-circle="a"
          cx="40"
          cy="40"
          r="40"
        />
      </clipPath>
    </defs>
    <circle
      data-circle="a"
      cx="40"
      cy="40"
      r="40"
      class="logo__ink"
    />
    <circle
      data-circle="b"
      cx="80"
      cy="40"
      r="40"
      class="logo__b logo__ink"
    />
    <g :clip-path="`url(#${clipId})`">
      <circle
        data-circle="b"
        cx="80"
        cy="40"
        r="40"
        class="logo__b logo__signal"
      />
    </g>
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  height: auto;
  overflow: visible;
}

.logo__ink {
  fill: var(--ink);
}

.logo__signal {
  fill: var(--signal);
}

/* Only the right circle moves, so the left circle that clips the red lens can stay put. */
.logo--intro .logo__b {
  transform-box: fill-box;
  transform-origin: center;
  animation: logo-intro 1s 150ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes logo-intro {
  from {
    translate: -40px 0;
    scale: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo--intro .logo__b {
    animation: none;
  }
}
</style>
