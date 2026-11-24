<script setup lang="ts">
const { isLoading } = useLoadingIndicator({ throttle: 200, hideDelay: 0 })
</script>

<template>
  <div
    class="loader"
    aria-live="polite"
  >
    <Transition name="loader">
      <div
        v-if="isLoading"
        class="loader__mark"
      >
        <SiteLogo
          class="loader__logo"
          loop
        />
        <span class="sr-only">Loading page</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.loader__mark {
  position: fixed;
  top: max(1rem, env(safe-area-inset-top));
  right: max(var(--gutter), env(safe-area-inset-right));
  z-index: 20;
  padding: 0.625rem 0.75rem;
  background: var(--paper);
  box-shadow: 0 0 0 1.5px var(--ink);
  pointer-events: none;
}

.loader__logo {
  width: 2.25rem;
}

.loader-enter-active {
  transition: opacity 200ms ease, translate 300ms var(--ease-out);
}

.loader-leave-active {
  transition: opacity 160ms ease;
}

.loader-enter-from {
  opacity: 0;
  translate: 0 -0.5rem;
}

.loader-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .loader-enter-active,
  .loader-leave-active {
    transition: opacity 160ms ease;
  }

  .loader-enter-from {
    translate: none;
  }
}
</style>
