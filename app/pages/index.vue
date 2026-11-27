<script setup lang="ts">
import { content, projects, sponsors } from '#build/site-data.mjs'
import type { Category } from '#shared/projects'
import { categories } from '#shared/projects'
import type { Sort } from '#shared/filter'
import { filterProjects, sorts } from '#shared/filter'
import { avatar } from '#shared/avatar'

const sortLabels: Record<Sort, string> = {
  stars: 'Stars',
  name: 'Name',
  recent: 'Recent',
}

const route = useRoute()
const router = useRouter()
const { optimiseAvatars } = useRuntimeConfig().public

const query = ref('')
const category = ref<Category>()
const sort = ref<Sort>('stars')
const maintainer = ref<string>()
const preview = ref<string>()

const categoryModel = computed({
  get: () => category.value,
  set: (value: Category | undefined) => startFilterTransition(() => {
    category.value = value
  }),
})

const sortModel = computed({
  get: () => sort.value,
  set: (value: Sort) => startFilterTransition(() => {
    sort.value = value
  }),
})

const logoIntroPlayed = useState('logo-intro-played', () => false)
const playLogoIntro = !logoIntroPlayed.value

onMounted(() => {
  logoIntroPlayed.value = true
})

const results = computed(() => filterProjects(projects, {
  query: query.value,
  category: category.value,
  maintainer: maintainer.value,
  sort: sort.value,
}))

const sortedSponsors = sponsors.toSorted((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

const categoryCounts = computed(() => categories
  .map(name => ({ name, count: projects.filter(project => project.category === name).length }))
  .filter(entry => entry.count > 0))

const isFiltered = computed(() => !!(query.value.trim() || category.value || maintainer.value))

const status = computed(() => {
  const total = projects.length
  const shown = results.value.length
  if (!isFiltered.value) {
    return `${total} projects`
  }
  return shown === 1 ? `1 of ${total} projects` : `${shown} of ${total} projects`
})

function first(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value
  return typeof item === 'string' ? item : undefined
}

onMounted(() => {
  query.value = first(route.query.q) ?? ''
  const requestedCategory = first(route.query.category)
  category.value = categories.find(name => name === requestedCategory)
  const requestedSort = first(route.query.sort)
  sort.value = sorts.find(name => name === requestedSort) ?? 'stars'
  maintainer.value = first(route.query.maintainer)

  watch([query, category, sort, maintainer], () => {
    router.replace({
      query: {
        q: query.value.trim() || undefined,
        category: category.value,
        sort: sort.value === 'stars' ? undefined : sort.value,
        maintainer: maintainer.value,
      },
    })
  })
})

const rail = useTemplateRef<HTMLElement>('rail')
const railTop = ref(0)

function updateRailTop() {
  if (!rail.value) return
  railTop.value = Math.min(0, window.innerHeight - rail.value.offsetHeight)
}

let railObserver: ResizeObserver | undefined

onMounted(() => {
  railObserver = new ResizeObserver(updateRailTop)
  if (rail.value) railObserver.observe(rail.value)
  window.addEventListener('resize', updateRailTop)
})

onBeforeUnmount(() => {
  railObserver?.disconnect()
  window.removeEventListener('resize', updateRailTop)
})

let clearPreviewTimer: ReturnType<typeof setTimeout> | undefined

function setPreview(handle: string | undefined) {
  clearTimeout(clearPreviewTimer)
  if (handle) {
    preview.value = handle
    return
  }
  clearPreviewTimer = setTimeout(() => {
    preview.value = undefined
  }, 80)
}

onBeforeUnmount(() => clearTimeout(clearPreviewTimer))

const maintainerChip = useTemplateRef<HTMLButtonElement>('maintainerChip')
const maintainerHint = useTemplateRef<HTMLParagraphElement>('maintainerHint')
const wallSection = useTemplateRef<HTMLElement>('wallSection')

async function selectMaintainer(handle: string) {
  clearTimeout(clearPreviewTimer)
  await startFilterTransition(() => {
    maintainer.value = handle
    preview.value = undefined
  })
  maintainerChip.value?.focus()
}

async function removeMaintainer() {
  await startFilterTransition(() => {
    maintainer.value = undefined
  })
  if (maintainerHint.value?.checkVisibility()) {
    maintainerHint.value.focus()
    return
  }
  document.querySelector<HTMLInputElement>('#project-search')?.focus()
}

async function clearFilters() {
  await startFilterTransition(() => {
    query.value = ''
    category.value = undefined
    maintainer.value = undefined
  })
  wallSection.value?.focus()
}

useSeoMeta({
  title: 'Made in Common: open source tools for the web, looked after together',
})

if (import.meta.server) {
  useSeoMeta({
    description: 'A home for open source tools made for the web. Most began with one person, and all are now looked after together.',
    ogTitle: 'Made in Common',
    ogDescription: 'Open source tools for the web, looked after together.',
    ogImage: 'https://made-in-common.dev/og.png',
    ogUrl: 'https://made-in-common.dev/',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
  })

  useHead({
    link: [{ rel: 'canonical', href: 'https://made-in-common.dev/' }],
  })
}
</script>

<template>
  <div class="page">
    <a
      class="skip-link"
      href="#projects"
    >Skip to projects</a>

    <div class="projects">
      <div
        ref="rail"
        class="rail"
        :style="{ '--rail-top': `${railTop}px` }"
      >
        <header class="masthead">
          <SiteLogo
            class="masthead__logo"
            :intro="playLogoIntro"
          />
          <h1 class="masthead__title">
            Made in Common
          </h1>
          <p class="masthead__lede">
            Open source tools for the web, looked after together.
          </p>
        </header>

        <div
          class="controls"
          role="search"
        >
          <form
            class="controls__form"
            @submit.prevent
          >
            <div class="field">
              <label
                class="field__label"
                for="project-search"
              >Find a project or maintainer</label>
              <input
                id="project-search"
                v-model="query"
                class="field__input"
                type="search"
                name="q"
                placeholder="Try taze, fonts or sxzz"
                autocomplete="off"
                spellcheck="false"
              >
            </div>

            <fieldset class="choice">
              <legend class="field__label">
                Category
              </legend>
              <div class="choice__options">
                <label class="chip">
                  <input
                    v-model="categoryModel"
                    type="radio"
                    name="category"
                    :value="undefined"
                  >
                  <span>All <span class="chip__count">{{ projects.length }}</span></span>
                </label>
                <label
                  v-for="entry in categoryCounts"
                  :key="entry.name"
                  class="chip"
                >
                  <input
                    v-model="categoryModel"
                    type="radio"
                    name="category"
                    :value="entry.name"
                  >
                  <span>{{ entry.name }} <span class="chip__count">{{ entry.count }}</span></span>
                </label>
              </div>
            </fieldset>

            <div
              class="field"
              :class="{ 'field--empty': !maintainer }"
              role="group"
              aria-labelledby="maintainer-label"
            >
              <p
                id="maintainer-label"
                class="field__label"
              >
                Maintainer
              </p>
              <button
                v-if="maintainer"
                ref="maintainerChip"
                type="button"
                class="filter-chip"
                @click="removeMaintainer"
              >
                <img
                  class="filter-chip__avatar"
                  v-bind="avatar(maintainer, 20, optimiseAvatars)"
                  alt=""
                >
                <span><span class="sr-only">Remove maintainer filter: </span>{{ maintainer }}</span>
                <svg
                  class="filter-chip__remove"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
              <a
                v-if="maintainer && sponsors.includes(maintainer)"
                class="field__link"
                :href="`https://github.com/sponsors/${maintainer}`"
              >Sponsor {{ maintainer }} on GitHub</a>
              <p
                v-else
                ref="maintainerHint"
                class="field__hint"
                tabindex="-1"
              >
                Choose a name on any project to see everything they look after.
              </p>
            </div>
          </form>
        </div>
      </div>

      <main
        id="projects"
        ref="wallSection"
        class="wall-section"
        tabindex="-1"
      >
        <h2 class="sr-only">
          Projects
        </h2>
        <div class="wall-status">
          <p
            role="status"
            class="wall-status__count"
          >
            {{ status }}
          </p>
          <fieldset class="sorter">
            <legend class="sr-only">
              Sort by
            </legend>
            <span
              class="sorter__label"
              aria-hidden="true"
            >Sort</span>
            <label
              v-for="option in sorts"
              :key="option"
              class="sort"
            >
              <input
                v-model="sortModel"
                type="radio"
                name="sort"
                :value="option"
              >
              <span>{{ sortLabels[option] }}</span>
            </label>
          </fieldset>
        </div>

        <ul
          v-if="results.length"
          class="wall"
          role="list"
        >
          <li
            v-for="(project, index) in results"
            :key="project.repo"
            class="wall__item"
            :class="{ 'wall__item--lead': index === 0 }"
            :style="{ viewTransitionName: getProjectTransitionName(project.name) }"
          >
            <ProjectCell
              :project="project"
              :lead="index === 0"
              :highlighted="!!preview && project.maintainers.includes(preview)"
              :dimmed="!!preview && !project.maintainers.includes(preview)"
              :preview="preview"
              @preview="setPreview"
              @select="selectMaintainer"
            />
          </li>
          <li
            v-if="!isFiltered"
            class="wall__item wall__item--vacant"
          >
            <div class="vacant">
              <ProjectMark
                class="vacant__mark"
                name="get involved"
                ghost
              />
              <p class="vacant__title">
                Room to pitch in
              </p>
              <p class="vacant__text">
                Every project here welcomes help, from a first question to a first pull request.
              </p>
              <a
                class="vacant__link"
                href="#join"
              >How to get involved</a>
            </div>
          </li>
        </ul>
        <div
          v-else
          class="empty"
        >
          <p class="empty__title">
            No projects match these filters.
          </p>
          <button
            type="button"
            class="text-button"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </main>
    </div>

    <section
      id="how"
      class="band"
      aria-labelledby="how-title"
    >
      <h2
        id="how-title"
        class="band__title"
      >
        How projects are run
      </h2>
      <div class="band__body">
        <MarkdownDocument
          class="prose prose--lede"
          :value="content.about!"
        />
        <MarkdownDocument
          class="prose principles"
          :value="content.principles!"
        />
      </div>
    </section>

    <section
      v-if="sponsors.length"
      id="support"
      class="band"
      aria-labelledby="support-title"
    >
      <h2
        id="support-title"
        class="band__title"
      >
        Support the maintainers
      </h2>
      <div class="band__body">
        <MarkdownDocument
          class="prose prose--lede"
          :value="content.support!"
        />
        <ul
          class="sponsors"
          role="list"
          aria-label="Maintainers on GitHub Sponsors"
        >
          <li
            v-for="login in sortedSponsors"
            :key="login"
          >
            <a
              class="sponsor"
              :href="`https://github.com/sponsors/${login}`"
            >
              <img
                class="sponsor__avatar"
                v-bind="avatar(login, 32, optimiseAvatars)"
                alt=""
                loading="lazy"
                decoding="async"
              >
              <span><span class="sr-only">Sponsor </span>{{ login }}</span>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section
      id="join"
      class="band band--inverse"
      aria-labelledby="join-title"
    >
      <h2
        id="join-title"
        class="band__title"
      >
        Get involved
      </h2>
      <div class="band__body">
        <MarkdownDocument
          class="prose prose--lede"
          :value="content.join!"
        />
        <div class="actions">
          <a
            class="action"
            href="#projects"
          >Find a project to help with</a>
          <a
            class="action action--quiet"
            href="https://github.com/orgs/made-in-common/discussions"
          >Start a conversation on GitHub</a>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.projects {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.rail {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: var(--gutter);
  border-bottom: 2px solid var(--rule);
}

.masthead__logo {
  view-transition-name: site-logo;
  width: clamp(2.75rem, 5vw, 3.75rem);
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.masthead__title {
  font-size: min(clamp(2.75rem, 6.5vw, 6rem), 22cqi);
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.masthead__lede {
  margin-top: 1.25rem;
  font-size: 1.25rem;
  line-height: 1.4;
  max-width: 30ch;
}

.controls__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field__label {
  display: block;
  padding: 0;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  font-stretch: var(--wide);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.field__input {
  width: 100%;
  height: 3rem;
  padding: 0 0.125rem;
  border: 0;
  border-bottom: 3px solid var(--ink);
  background: transparent;
  font-size: 1.25rem;
  appearance: none;
}

.field__input::-webkit-search-cancel-button {
  width: 1.25rem;
  height: 1.25rem;
  background: var(--ink);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M4 4l12 12M16 4L4 16' stroke='black' stroke-width='2.5'/%3E%3C/svg%3E") center / contain no-repeat;
  cursor: pointer;
  appearance: none;
}

.field__input::placeholder {
  color: var(--muted);
  opacity: 1;
}

.field__input:focus-visible {
  outline: 3px solid transparent;
  outline-offset: 2px;
  border-bottom-color: var(--signal);
  box-shadow: 0 3px 0 var(--signal);
}

.choice {
  min-width: 0;
  padding: 0;
  border: 0;
}

.choice__options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sorter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 1rem;
  min-width: 0;
  padding: 0;
  border: 0;
}

.sorter__label {
  font-size: 0.8125rem;
  font-weight: 700;
  font-stretch: var(--wide);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.chip,
.sort {
  position: relative;
  cursor: pointer;
}

.chip input,
.sort input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chip > span {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 0.875rem;
  border: 1.5px solid var(--ink);
  font-size: 0.9375rem;
  transition: background-color 120ms ease, color 120ms ease;
}

.chip__count {
  font-size: 0.8125rem;
  color: var(--muted);
}

.chip input:checked + span {
  background: var(--ink);
  color: var(--paper);
}

.chip input:checked + span .chip__count {
  color: inherit;
}

.chip input:focus-visible + span,
.sort input:focus-visible + span {
  outline: 3px solid var(--signal);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .chip:hover input:not(:checked) + span {
    background: var(--ghost);
  }
}

.sort > span {
  transition: box-shadow 200ms ease;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-size: 0.9375rem;
  box-shadow: inset 0 -3px transparent;
}

.sort input:checked + span {
  font-weight: 700;
  box-shadow: inset 0 -3px var(--signal);
}

.wall-section {
  container-type: inline-size;
  min-width: 0;
}

.wall-section:focus {
  outline: none;
}

.wall-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  min-height: 3.5rem;
  padding: 0.5rem 1.25rem;
  border-bottom: 1px solid var(--rule);
  font-size: 0.9375rem;
}

.wall-status__count {
  font-weight: 700;
  font-stretch: var(--wide);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8125rem;
}

.field__hint {
  max-width: 32ch;
  outline: none;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--muted);
}

.filter-chip {
  view-transition-name: maintainer-filter;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 0.75rem 0 0.5rem;
  border: 1.5px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.9375rem;
  cursor: pointer;
}

.filter-chip:hover > span {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.filter-chip__avatar {
  width: 1.5rem;
  height: 1.5rem;
  background: var(--ghost);
}

.filter-chip__remove {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
}

.text-button {
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  background: none;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.wall__item {
  view-transition-class: project;
}

.wall__item--vacant {
  view-transition-name: project-vacant;
}

.wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14.5rem), 1fr));
  grid-auto-flow: dense;
  padding: 0;
  list-style: none;
}

@container (min-width: 36rem) {
  .wall__item--lead {
    grid-column: span 2;
    grid-row: span 2;
  }
}

.vacant {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  height: 100%;
  padding: 1rem 1.125rem 0.875rem;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.vacant__mark {
  width: 2.75rem;
  margin-bottom: 0.5rem;
}

.vacant__title {
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.vacant__text {
  color: var(--muted);
  max-width: 30ch;
}

.vacant__link {
  margin-top: auto;
  padding-top: 0.75rem;
  font-weight: 700;
}

.empty {
  padding: 3rem 1.25rem;
}

.empty__title {
  font-size: 1.375rem;
  font-weight: 800;
}

.band {
  display: grid;
  gap: 2rem;
  padding: clamp(3rem, 8vw, 6rem) var(--gutter);
  border-top: 2px solid var(--rule);
}

.band__title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.035em;
  text-wrap: balance;
  max-width: 8ch;
  min-width: min-content;
}

@media (max-width: 16rem) {
  .band__title {
    min-width: 0;
    hyphens: auto;
  }
}

.band__body {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  min-width: 0;
}

.band--inverse {
  --rule: var(--inverse-rule);
  --signal: var(--inverse-signal);
  --on-signal: var(--inverse-on-signal);
  background: var(--inverse-bg);
  color: var(--inverse-fg);
  border-top: 0;
}

.band--inverse ::selection {
  background: var(--inverse-fg);
  color: var(--inverse-bg);
}

.prose :deep(p) {
  max-width: 62ch;
  line-height: 1.55;
}

.prose :deep(p + p) {
  margin-top: 1em;
}

.prose--lede :deep(p) {
  font-size: 1.25rem;
  line-height: 1.5;
}

.principles :deep(ul) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: 2rem 1.5rem;
  padding: 0;
  list-style: none;
}

.principles :deep(li) {
  padding-top: 1rem;
  border-top: 2px solid var(--rule);
  line-height: 1.5;
}

.principles :deep(strong) {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.action {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 3.5rem;
  padding: 0 1.5rem;
  background: var(--signal);
  color: var(--on-signal);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: transform 160ms var(--ease-out);
}

.sponsors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  padding: 0;
  list-style: none;
}

.sponsor {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  font-size: 1.0625rem;
  text-decoration: none;
}

.sponsor:hover span {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.2em;
}

.sponsor__avatar {
  transition: filter 200ms ease;
  width: 2rem;
  height: 2rem;
  background: var(--ghost);
  filter: grayscale(1);
}

.sponsor:hover .sponsor__avatar,
.sponsor:focus-visible .sponsor__avatar {
  filter: none;
}

.field__link {
  display: flex;
  width: fit-content;
  margin-top: 0.25rem;
  align-items: center;
  min-height: 2.75rem;
  font-size: 0.9375rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action--quiet {
  background: none;
  color: inherit;
  box-shadow: inset 0 0 0 2px currentColor;
}

.action:hover {
  text-decoration: underline;
}

.action:active {
  transform: scale(0.97);
}

.band--inverse :focus-visible {
  outline-color: var(--inverse-fg);
}

@media (min-width: 64rem) {
  .projects {
    grid-template-columns: minmax(20rem, 1fr) minmax(0, 2fr);
  }

  .rail {
    border-bottom: 0;
  }

  .wall-section {
    border-left: 2px solid var(--rule);
  }

  .band {
    grid-template-columns: minmax(20rem, 1fr) minmax(0, 2fr);
    gap: 0;
  }

  .band__title {
    padding-right: var(--gutter);
  }
}

@media (min-width: 64rem) {
  .rail {
    position: sticky;
    top: var(--rail-top, 0);
    align-self: start;
  }
}

@media (min-width: 64rem) and (max-height: 50rem) {
  .rail {
    gap: 1.25rem;
    padding-block: 1.5rem;
  }

  .masthead__logo {
    margin-bottom: 0.75rem;
  }

  .masthead__title {
    font-size: min(clamp(2.75rem, 6.5vw, 6rem), 22cqi, 9vh);
  }

  .masthead__lede {
    margin-top: 0.75rem;
    font-size: 1.125rem;
  }

  .field__input {
    height: 2.5rem;
  }

  .chip > span {
    min-height: 2.25rem;
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }
}

@media (min-width: 64rem) and (max-height: 40rem) {
  .field--empty {
    display: none;
  }
}

@media (forced-colors: active) {
  .chip input:checked + span {
    forced-color-adjust: none;
    background: Highlight;
    border-color: Highlight;
    color: HighlightText;
  }

  .sort input:checked + span {
    text-decoration: underline 3px;
    text-underline-offset: 0.35em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .action {
    transition: none;
  }

  .action:active {
    transform: none;
  }
}
</style>
