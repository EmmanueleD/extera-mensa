import type { Session, User } from '@supabase/supabase-js'
import { ref } from 'vue'
import { getSupabase } from '../lib/supabase'
import { loginIdentifierToEmail, normalizeUsername, usernameToEmail } from '../lib/username'

const session = ref<Session | null>(null)
const user = ref<User | null>(null)
const ready = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
let initialization: Promise<void> | undefined

type ProviderAuthError = { code?: string; message: string }
type ErrorMessage = string | ((providerError: ProviderAuthError) => string)

function message(fallback: string) {
  error.value = fallback
  return false
}

async function run(
  action: () => Promise<{ error: ProviderAuthError | null }>,
  fallback: ErrorMessage,
) {
  loading.value = true
  error.value = null
  try {
    const result = await action()
    if (!result.error) return true
    return message(typeof fallback === 'function' ? fallback(result.error) : fallback)
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

  async function signUp(username: string, displayName: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: {
          data: { display_name: displayName.trim(), username: normalizeUsername(username) },
        },
      })
      if (signUpError)
        return message('Nome utente o nome visualizzato già utilizzati, oppure dati non validi.')
      if (!data.session)
        return message(
          'Account creato, ma l’accesso non è ancora abilitato. Contatta l’amministratore.',
        )
      return true
    } catch {
      return message('Connessione non disponibile. Riprova.')
    } finally {
      loading.value = false
    }
  }

  const signIn = (identifier: string, password: string) =>
    run(
      () =>
        supabase.auth.signInWithPassword({ email: loginIdentifierToEmail(identifier), password }),
      (providerError) =>
        providerError.code === 'email_not_confirmed'
          ? 'L’account esiste, ma deve essere abilitato dall’amministratore.'
          : 'Credenziali non valide.',
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
    signOut,
  }
}
