<template>
  <svg
    class="logo"
    viewBox="0 0 120 80"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="40"
      cy="40"
      r="40"
      class="logo__ink"
    />
    <circle
      cx="80"
      cy="40"
      r="40"
      class="logo__ink"
    />
    <path
      d="M60 5.36A40 40 0 0 1 60 74.64A40 40 0 0 1 60 5.36Z"
      class="logo__signal"
    />
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  height: auto;
}

.logo__ink {
  fill: var(--ink);
}

.logo__signal {
  fill: var(--signal);
}
</style>
