<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'
import { useToday } from '../../composables/useToday'

const router = useRouter()
const today = useToday()
const profile = useProfile()

async function logout() {
  if (await useAuth().signOut()) await router.push('/login')
}
</script>

<template>
  <header
    class="app-topbar navbar sticky top-0 z-10 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur"
  >
    <div class="app-topbar__brand flex-1">
      <RouterLink class="text-lg font-black tracking-tight" to="/today">Extera Mensa</RouterLink>
    </div>
    <nav aria-label="Navigazione principale" class="app-topbar__nav flex gap-1">
      <button
        v-if="today.answered.value"
        class="app-topbar__response btn btn-ghost btn-sm"
        type="button"
        @click="today.startEditing"
      >
        Modifica risposta
      </button>
      <RouterLink class="btn btn-ghost btn-sm" to="/today">Oggi</RouterLink>
      <button class="btn btn-ghost btn-sm" type="button" @click="profile.openDrawer">
        Profilo
      </button>
      <RouterLink class="btn btn-ghost btn-sm" to="/statistics">Statistiche</RouterLink>
      <button class="btn btn-ghost btn-sm" type="button" @click="logout">Esci</button>
    </nav>
  </header>
</template>
