<script setup lang="ts">
import { docs as available } from '#build/site-data.mjs'
import { docs } from '~~/shared/docs'

definePageMeta({
  validate: (route) => {
    const slug = 'doc' in route.params ? route.params.doc : undefined
    return docs.some(doc => doc.slug === slug && !!available[doc.slug])
  },
})

const route = useRoute('doc')
const doc = computed(() => docs.find(entry => entry.slug === route.params.doc)!)
const value = computed(() => available[doc.value.slug]!)
const links = docs.filter(entry => available[entry.slug])

useSeoMeta({
  title: () => `${doc.value.title} · Made in Common`,
  description: () => `${doc.value.title} for Made in Common: open source tools for the web, looked after together.`,
})
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
      <nav
        v-if="links.length > 1"
        class="side__nav"
        aria-label="Documents"
      >
        <NuxtLink
          v-for="entry in links"
          :key="entry.slug"
          :to="`/${entry.slug}`"
        >
          {{ entry.title }}
        </NuxtLink>
      </nav>
    </header>

    <main
      id="content"
      class="doc"
      tabindex="-1"
    >
      <MarkdownDocument
        class="doc__body"
        :value="value"
      />
    </main>

    <SiteFooter class="page__footer" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100vh;
  grid-template-rows: auto 1fr auto;
}

.side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
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

.side__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
}

.side__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  text-decoration: none;
  box-shadow: inset 0 -2px transparent;
}

.side__nav a:hover {
  text-decoration: underline;
}

.side__nav a.router-link-exact-active {
  font-weight: 700;
  box-shadow: inset 0 -3px var(--signal);
}

.doc {
  padding: clamp(2.5rem, 7vw, 5rem) var(--gutter) clamp(3rem, 8vw, 6rem);
}

.doc:focus {
  outline: none;
}

.doc__body {
  max-width: 44rem;
}

.doc__body :deep(h1) {
  margin-bottom: 2rem;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.doc__body :deep(h2) {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 2px solid var(--rule);
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.doc__body :deep(h3) {
  margin-top: 2rem;
  font-size: 1.125rem;
  font-weight: 800;
}

.doc__body :deep(:is(h2, h3) + *) {
  margin-top: 0.75rem;
}

.doc__body :deep(:is(p, ul, ol, blockquote)) {
  max-width: 62ch;
  line-height: 1.6;
}

.doc__body :deep(:is(p, ul, ol, blockquote) + :is(p, ul, ol, blockquote)) {
  margin-top: 1em;
}

.doc__body :deep(h1 + p) {
  font-size: 1.25rem;
  line-height: 1.5;
}

.doc__body :deep(:is(ul, ol)) {
  padding-left: 1.25rem;
}

.doc__body :deep(li + li) {
  margin-top: 0.375rem;
}

.doc__body :deep(li::marker) {
  color: var(--signal);
}

.doc__body :deep(blockquote) {
  margin-inline: 0;
  padding-left: 1rem;
  border-left: 3px solid var(--signal);
}

.doc__body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
}

@media (min-width: 64rem) {
  .page {
    grid-template-columns: minmax(20rem, 1fr) minmax(0, 2fr);
    grid-template-rows: 1fr auto;
  }

  .side {
    position: sticky;
    top: 0;
    align-self: start;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 2rem;
    padding: 2.5rem var(--gutter);
    border-bottom: 0;
  }

  .side__nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .doc {
    border-left: 2px solid var(--rule);
  }

  .page__footer {
    grid-column: 1 / -1;
  }
}
</style>
