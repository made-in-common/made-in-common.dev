<script setup lang="ts">
import type { Project } from '#shared/projects'

const props = defineProps<{
  project: Project
  lead?: boolean
  highlighted?: boolean
  dimmed?: boolean
}>()

const emit = defineEmits<{
  preview: [handle: string | undefined]
  select: [handle: string]
}>()

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('en-GB')

const lastPush = computed(() => props.project.pushedAt ? monthFormat.format(new Date(props.project.pushedAt)) : undefined)
const titleId = computed(() => `project-${props.project.name}`)
</script>

<template>
  <article
    class="cell"
    :class="{ 'cell--lead': lead, 'cell--highlighted': highlighted, 'cell--dimmed': dimmed }"
    :aria-labelledby="titleId"
  >
    <ProjectMark
      class="cell__mark"
      :name="project.name"
    />
    <h3
      :id="titleId"
      class="cell__name"
    >
      <a :href="project.url">{{ project.name }}</a>
    </h3>
    <p
      v-if="project.description"
      class="cell__description"
    >
      {{ project.description }}
    </p>
    <ul
      class="cell__maintainers"
      role="list"
      aria-label="Maintainers"
    >
      <li
        v-for="handle in project.maintainers"
        :key="handle"
      >
        <button
          type="button"
          class="maintainer"
          @click="emit('select', handle)"
          @mouseenter="emit('preview', handle)"
          @mouseleave="emit('preview', undefined)"
          @focus="emit('preview', handle)"
          @blur="emit('preview', undefined)"
        >
          <img
            class="maintainer__avatar"
            :src="`https://avatars.githubusercontent.com/${handle}?s=40`"
            alt=""
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
          >
          <span><span class="sr-only">Show projects by </span>{{ handle }}</span>
        </button>
      </li>
      <li
        v-if="project.maintainers.length < 2"
        class="cell__wanted"
      >
        Looking for maintainers
      </li>
    </ul>
    <p class="cell__meta">
      <span v-if="project.stars !== undefined">{{ numberFormat.format(project.stars) }} stars</span>
      <span v-if="lastPush">Pushed {{ lastPush }}</span>
      <a
        v-if="project.npm"
        :href="`https://npmx.dev/package/${project.npm}`"
      ><span class="sr-only">npm package </span>{{ project.npm }}</a>
    </p>
  </article>
</template>

<style scoped>
.cell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas:
    'name mark'
    'description description'
    'maintainers maintainers'
    'meta meta';
  column-gap: 1rem;
  height: 100%;
  padding: 1rem 1.125rem 0.875rem;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  transition: box-shadow 150ms var(--ease-out);
}

.cell--highlighted {
  box-shadow: inset 0 0 0 4px var(--signal);
}

.cell--dimmed .cell__mark {
  opacity: 0.2;
}

.cell--dimmed .cell__name,
.cell--dimmed .cell__description {
  color: var(--muted);
}

.cell__mark {
  grid-area: mark;
  width: 2.75rem;
  transition: opacity 150ms ease;
}

.cell__name {
  grid-area: name;
  align-self: start;
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.cell__name a {
  text-decoration: none;
}

.cell__name a:hover {
  text-decoration: underline;
}

.cell__name a::after {
  content: '';
  position: absolute;
  inset: 0;
}

.cell__description {
  grid-area: description;
  margin-top: 0.375rem;
  font-size: 0.9375rem;
  line-height: 1.4;
  max-width: 42ch;
}

.cell__maintainers {
  grid-area: maintainers;
  align-self: end;
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.75rem;
  padding: 0.5rem 0 0;
  list-style: none;
}

.maintainer {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0;
  border: 0;
  background: none;
  font-size: 0.9375rem;
  cursor: pointer;
}

.maintainer:hover span {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.maintainer__avatar {
  width: 1.25rem;
  height: 1.25rem;
  filter: grayscale(1);
  background: var(--ghost);
}

.cell__wanted {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--signal);
}

.cell__wanted::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
}

.maintainer:hover .maintainer__avatar,
.maintainer:focus-visible .maintainer__avatar {
  filter: none;
}

.cell__meta {
  grid-area: meta;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 1rem;
  margin-top: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--hairline);
  font-size: 0.8125rem;
  color: var(--muted);
}

.cell__meta > * {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
}

.cell__meta a {
  position: relative;
  z-index: 1;
  color: var(--ink);
}

.cell--lead {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  grid-template-areas:
    'name mark'
    'description mark'
    'maintainers mark'
    'meta meta';
  column-gap: 2rem;
  padding: 1.5rem 1.5rem 0.875rem;
}

.cell--lead .cell__mark {
  width: 100%;
  max-width: 15rem;
  justify-self: end;
  align-self: end;
  margin-bottom: 1rem;
}

.cell--lead .cell__name {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  letter-spacing: -0.035em;
  line-height: 0.92;
}

.cell--lead .cell__description {
  margin-top: 1rem;
  font-size: 1.25rem;
  max-width: 24ch;
}

@media (max-width: 40rem) {
  .cell--lead {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'name mark'
      'description description'
      'maintainers maintainers'
      'meta meta';
    column-gap: 1rem;
    padding: 1rem 1.125rem 0.875rem;
  }

  .cell--lead .cell__mark {
    width: 3.5rem;
    align-self: start;
    margin-bottom: 0;
  }

  .cell--lead .cell__name {
    font-size: 2.5rem;
  }
}
</style>
