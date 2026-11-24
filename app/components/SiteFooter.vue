<script setup lang="ts">
import { docs as availableDocs, generatedAt } from '#build/site-data.mjs'
import { docs } from '#shared/docs'

const updated = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(generatedAt))
const links = docs.filter(doc => availableDocs[doc.slug])
</script>

<template>
  <footer class="footer">
    <SiteLogo class="footer__logo" />
    <p class="footer__name">
      Made in Common
    </p>
    <p>Project details from GitHub, updated {{ updated }}.</p>
    <nav
      class="footer__nav"
      aria-label="Footer"
    >
      <NuxtLink to="/#how">
        How projects are run
      </NuxtLink>
      <NuxtLink to="/#join">
        Get involved
      </NuxtLink>
      <NuxtLink
        v-for="doc in links"
        :key="doc.slug"
        :to="`/${doc.slug}`"
      >
        {{ doc.title }}
      </NuxtLink>
      <a href="https://github.com/made-in-common">GitHub</a>
    </nav>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 2rem;
  padding: 1.5rem var(--gutter);
  border-top: 2px solid var(--rule);
  font-size: 0.9375rem;
}

.footer__logo {
  width: 2.25rem;
}

.footer__name {
  font-weight: 800;
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.footer__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
}

@media (min-width: 64rem) {
  .footer__nav {
    margin-left: auto;
  }
}
</style>
