<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { isLegacyEmail, USERNAME_MAX, validateUsername } from '../lib/username'

const props = defineProps<{
  mode: 'login' | 'register'
}>()

const router = useRouter()
const auth = useAuth()
const username = ref('')
const displayName = ref('')
const password = ref('')
const localError = ref<string | null>(null)

const content = computed(() =>
  props.mode === 'register'
    ? { title: 'Crea il tuo profilo', action: 'Registrati' }
    : { title: 'Bentornato', action: 'Accedi' },
)

function usernameError() {
  if (props.mode === 'login' && isLegacyEmail(username.value)) return null
  return validateUsername(username.value)
}

async function submit() {
  localError.value = usernameError()
  if (localError.value) return

  const success =
    props.mode === 'register'
      ? await auth.signUp(username.value, displayName.value, password.value)
      : await auth.signIn(username.value, password.value)

  if (!success) {
    localError.value = auth.error.value
    return
  }
  await router.push('/today')
}
</script>

<template>
  <main class="auth-page grid min-h-svh place-items-center px-5 py-12">
    <section class="auth-card organic-card w-full max-w-md">
      <h1 class="text-3xl font-black">{{ content.title }}</h1>
      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <label class="form-control block">
          <span class="label-text">Nome utente</span>
          <input
            v-model="username"
            class="input input-bordered mt-1 w-full"
            name="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            :maxlength="mode === 'register' ? USERNAME_MAX : undefined"
            required
          />
        </label>
        <label v-if="mode === 'register'" class="form-control block">
          <span class="label-text">Nome visualizzato</span>
          <input
            v-model="displayName"
            class="input input-bordered mt-1 w-full"
            name="displayName"
            required
            maxlength="30"
          />
        </label>
        <label class="form-control block">
          <span class="label-text">Password</span>
          <input
            v-model="password"
            class="input input-bordered mt-1 w-full"
            name="password"
            type="password"
            minlength="8"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            required
          />
        </label>
        <p v-if="localError" role="alert" class="alert alert-error text-sm">{{ localError }}</p>
        <button class="btn btn-primary w-full" :disabled="auth.loading.value">
          {{ content.action }}
        </button>
      </form>
      <div v-if="mode === 'login'" class="mt-5 space-y-2 text-sm">
        <RouterLink to="/register">Registrati</RouterLink>
        <p class="text-base-content/70">Password dimenticata? Contatta l’amministratore.</p>
      </div>
      <div v-else class="mt-5 text-sm">
        <RouterLink to="/login">Hai già un account? Accedi</RouterLink>
      </div>
    </section>
  </main>
</template>
