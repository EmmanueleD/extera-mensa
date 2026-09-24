<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const props = defineProps<{
  mode: 'login' | 'register' | 'recover' | 'update-password'
}>()

const router = useRouter()
const auth = useAuth()
const displayName = ref('')
const email = ref('')
const password = ref('')
const complete = ref(false)
const localError = ref<string | null>(null)

const content = computed(() => {
  if (props.mode === 'register') return { title: 'Crea il tuo profilo', action: 'Registrati' }
  if (props.mode === 'recover') return { title: 'Recupera la password', action: 'Invia email' }
  if (props.mode === 'update-password')
    return { title: 'Scegli una nuova password', action: 'Salva' }
  return { title: 'Bentornato', action: 'Accedi' }
})

async function submit() {
  localError.value = null
  let success: boolean
  if (props.mode === 'register') {
    success = await auth.signUp(displayName.value, email.value, password.value)
  } else if (props.mode === 'recover') {
    success = await auth.recoverPassword(email.value)
  } else if (props.mode === 'update-password') {
    success = await auth.updatePassword(password.value)
  } else {
    success = await auth.signIn(email.value, password.value)
  }

  if (!success) {
    localError.value = auth.error.value
    return
  }
  if (props.mode === 'register' || props.mode === 'recover') complete.value = true
  else await router.push('/today')
}
</script>

<template>
  <main class="grid min-h-svh place-items-center px-5 py-12">
    <section class="organic-card w-full max-w-md">
      <template v-if="complete">
        <h1 class="text-3xl font-black">Controlla la tua email</h1>
        <p class="mt-3 text-base-content/70">Segui il link ricevuto per continuare.</p>
      </template>
      <template v-else>
        <h1 class="text-3xl font-black">{{ content.title }}</h1>
        <form class="mt-6 space-y-4" @submit.prevent="submit">
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
          <label v-if="mode !== 'update-password'" class="form-control block">
            <span class="label-text">Email</span>
            <input
              v-model="email"
              class="input input-bordered mt-1 w-full"
              name="email"
              type="email"
              autocomplete="email"
              required
            />
          </label>
          <label v-if="mode !== 'recover'" class="form-control block">
            <span class="label-text">Password</span>
            <input
              v-model="password"
              class="input input-bordered mt-1 w-full"
              name="password"
              type="password"
              minlength="8"
              autocomplete="current-password"
              required
            />
          </label>
          <p v-if="localError" role="alert" class="alert alert-error text-sm">{{ localError }}</p>
          <button class="btn btn-primary w-full" :disabled="auth.loading.value">
            {{ content.action }}
          </button>
        </form>
        <div v-if="mode === 'login'" class="mt-5 flex justify-between text-sm">
          <RouterLink to="/register">Registrati</RouterLink>
          <RouterLink to="/recover-password">Password dimenticata?</RouterLink>
        </div>
      </template>
    </section>
  </main>
</template>
