<script setup lang="ts">
import AppTopbar from './components/layout/AppTopbar.vue'
</script>

<template>
  <AppTopbar v-if="$route.meta.shell" />
  <main>
    <RouterView />
  </main>
</template>
