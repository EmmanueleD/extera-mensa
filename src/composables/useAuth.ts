import type { Session, User } from '@supabase/supabase-js'
import { ref } from 'vue'
import { getSupabase } from '../lib/supabase'

const session = ref<Session | null>(null)
const user = ref<User | null>(null)
const ready = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
let initialization: Promise<void> | undefined

function message(fallback: string) {
  error.value = fallback
  return false
}

async function run(action: () => Promise<{ error: { message: string } | null }>, fallback: string) {
  loading.value = true
  error.value = null
  try {
    const result = await action()
    return result.error ? message(fallback) : true
  } catch {
    return message('Connessione non disponibile. Riprova.')
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  const supabase = getSupabase()

  function initialize() {
    if (initialization) return initialization
    initialization = supabase.auth
      .getSession()
      .then(({ data }) => {
        session.value = data.session
        user.value = data.session?.user ?? null
        supabase.auth.onAuthStateChange((_event, nextSession) => {
          session.value = nextSession
          user.value = nextSession?.user ?? null
        })
      })
      .catch(() => {
        session.value = null
        user.value = null
        error.value = 'Sessione non disponibile. Accedi nuovamente.'
      })
      .finally(() => {
        ready.value = true
      })
    return initialization
  }

  const signUp = (displayName: string, email: string, password: string) =>
    run(
      () =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/today`,
          },
        }),
      'Email o nome già utilizzati, oppure dati non validi.',
    )

  const signIn = (email: string, password: string) =>
    run(() => supabase.auth.signInWithPassword({ email, password }), 'Credenziali non valide.')

  const recoverPassword = (email: string) =>
    run(
      () =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        }),
      'Non è stato possibile inviare il messaggio di recupero.',
    )

  const updatePassword = (password: string) =>
    run(
      () => supabase.auth.updateUser({ password }),
      'Non è stato possibile aggiornare la password.',
    )

  const signOut = () => run(() => supabase.auth.signOut(), 'Non è stato possibile uscire.')

  return {
    session,
    user,
    ready,
    loading,
    error,
    initialize,
    signUp,
    signIn,
    recoverPassword,
    updatePassword,
    signOut,
  }
}
