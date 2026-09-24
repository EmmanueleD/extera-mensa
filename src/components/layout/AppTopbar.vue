<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()

async function logout() {
  if (await useAuth().signOut()) await router.push('/login')
}
</script>

<template>
  <header
    class="navbar sticky top-0 z-10 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur"
  >
    <div class="flex-1">
      <RouterLink class="text-lg font-black tracking-tight" to="/today">Extera Mensa</RouterLink>
    </div>
    <nav aria-label="Navigazione principale" class="flex gap-1">
      <RouterLink class="btn btn-ghost btn-sm" to="/today">Oggi</RouterLink>
      <RouterLink class="btn btn-ghost btn-sm" to="/statistics">Statistiche</RouterLink>
      <button class="btn btn-ghost btn-sm" type="button" @click="logout">Esci</button>
    </nav>
  </header>
</template>
