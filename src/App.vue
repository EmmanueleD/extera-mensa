<script setup lang="ts">
import AppTopbar from './components/layout/AppTopbar.vue'
import ProfileDrawer from './components/profile/ProfileDrawer.vue'
import { useProfile } from './composables/useProfile'

const profile = useProfile()
</script>

<template>
  <AppTopbar v-if="$route.meta.shell" />
  <main>
    <RouterView />
  </main>
  <ProfileDrawer v-if="$route.meta.shell" :open="profile.open.value" @close="profile.closeDrawer" />
</template>
