<script setup lang="ts">
import { createMark, MARK_SIZE } from '#shared/mark'

const props = defineProps<{
  name: string
  ghost?: boolean
}>()

const shapes = computed(() => createMark(props.name))
</script>

<template>
  <svg
    class="mark"
    :class="{ 'mark--ghost': ghost }"
    :viewBox="`0 0 ${MARK_SIZE} ${MARK_SIZE}`"
    :width="MARK_SIZE"
    :height="MARK_SIZE"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(shape, index) in shapes"
      :key="index"
      :d="shape.d"
      :class="`mark__${shape.tone}`"
      :fill="shape.stroke ? 'none' : 'currentColor'"
      :stroke="shape.stroke ? 'currentColor' : undefined"
      :stroke-width="shape.stroke"
    />
  </svg>
</template>

<style scoped>
.mark {
  display: block;
  width: 100%;
  height: auto;
  overflow: hidden;
}

.mark__ink {
  color: var(--ink);
}

.mark__signal {
  color: var(--signal);
}

.mark--ghost path {
  color: var(--ghost);
}
</style>
