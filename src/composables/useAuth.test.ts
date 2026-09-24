import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseAuth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ getSupabase: () => ({ auth: supabaseAuth }) }))

import { useAuth } from './useAuth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth', () => {
  it('signs up with the synthetic email and username metadata', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { session: {} }, error: null })
    const auth = useAuth()

    expect(await auth.signUp(' Anna ', ' Anna R ', 'password-lunga')).toBe(true)
    expect(supabaseAuth.signUp).toHaveBeenCalledWith({
      email: 'anna@users.ext-mensa.it',
      password: 'password-lunga',
      options: { data: { display_name: 'Anna R', username: 'anna' } },
    })
  })

  it('reports a created account without session as not yet enabled', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    const auth = useAuth()

    expect(await auth.signUp('anna', 'Anna', 'password-lunga')).toBe(false)
    expect(auth.error.value).toContain('Contatta l’amministratore')
  })

  it('mentions taken username or display name on sign-up errors', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { session: null }, error: { message: 'x' } })
    const auth = useAuth()

    expect(await auth.signUp('anna', 'Anna', 'password-lunga')).toBe(false)
    expect(auth.error.value).toContain('Nome utente o nome visualizzato già utilizzati')
  })

  it('signs in with a username or a legacy email', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({ error: null })
    const auth = useAuth()

    await auth.signIn('Anna', 'pw-lunga-1')
    await auth.signIn('anna@example.test', 'pw-lunga-2')
    expect(supabaseAuth.signInWithPassword).toHaveBeenNthCalledWith(1, {
      email: 'anna@users.ext-mensa.it',
      password: 'pw-lunga-1',
    })
    expect(supabaseAuth.signInWithPassword).toHaveBeenNthCalledWith(2, {
      email: 'anna@example.test',
      password: 'pw-lunga-2',
    })
  })
})
