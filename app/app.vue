<script setup lang="ts">
import { preloads } from 'fontless/runtime'

useHead({ link: preloads.map(link => ({ ...link, crossorigin: link.crossorigin ?? 'anonymous' })) })
</script>

<template>
  <NuxtPage />
</template>
