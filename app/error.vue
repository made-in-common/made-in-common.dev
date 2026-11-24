<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const status = computed(() => Number(props.error.status || 500))
const notFound = computed(() => status.value === 404)
const title = computed(() => notFound.value ? 'Page not found' : 'Something went wrong')

useSeoMeta({ title: () => `${title.value} · Made in Common` })
</script>

<template>
  <div class="page">
    <a
      class="skip-link"
      href="#content"
    >Skip to content</a>

    <header class="side">
      <NuxtLink
        to="/"
        class="home"
      >
        <SiteLogo class="home__logo" />
        <span>Made in Common</span>
      </NuxtLink>
    </header>

    <main
      id="content"
      class="error"
      tabindex="-1"
    >
      <p class="error__code">
        {{ status }}
      </p>
      <h1 class="error__title">
        {{ title }}
      </h1>
      <p class="error__text">
        {{ notFound ? 'There is nothing at this address. It may have moved, or the link may be wrong.' : 'The page could not be loaded. Please try again in a moment.' }}
      </p>
      <button
        type="button"
        class="error__action"
        @click="clearError({ redirect: '/' })"
      >
        Back to all projects
      </button>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
}

.side {
  padding: 1.5rem var(--gutter);
  border-bottom: 2px solid var(--rule);
}

.home {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.75rem;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.home:hover span {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

.home__logo {
  width: 3rem;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  padding: clamp(2.5rem, 7vw, 5rem) var(--gutter);
}

.error:focus {
  outline: none;
}

.error__code {
  font-size: 0.8125rem;
  font-weight: 700;
  font-stretch: var(--wide);
  letter-spacing: 0.06em;
  color: var(--signal);
}

.error__title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.error__text {
  max-width: 40ch;
  font-size: 1.25rem;
  line-height: 1.5;
}

.error__action {
  display: inline-flex;
  align-items: center;
  min-height: 3.5rem;
  margin-top: 1rem;
  padding: 0 1.5rem;
  border: 0;
  background: var(--signal);
  color: var(--on-signal);
  font-weight: 700;
  cursor: pointer;
}

.error__action:hover {
  text-decoration: underline;
}
</style>
