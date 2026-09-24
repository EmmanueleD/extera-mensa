import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage.vue'

const auth = vi.hoisted(() => ({
  error: { value: null as string | null },
  loading: { value: false },
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock('../composables/useAuth', () => ({ useAuth: () => auth }))

async function mountPage(mode: 'login' | 'register') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/today', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/register', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(AuthPage, { props: { mode }, global: { plugins: [router] } })
  return { wrapper, router }
}

beforeEach(() => {
  auth.error.value = null
  auth.loading.value = false
  vi.clearAllMocks()
})

describe('AuthPage', () => {
  it('registers with username and display name, then goes to today', async () => {
    auth.signUp.mockResolvedValue(true)
    const { wrapper, router } = await mountPage('register')

    await wrapper.get('[name="username"]').setValue('Anna.R')
    await wrapper.get('[name="displayName"]').setValue('Anna')
    await wrapper.get('[name="password"]').setValue('password-lunga')
    expect(wrapper.get('[name="password"]').attributes('autocomplete')).toBe('new-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(auth.signUp).toHaveBeenCalledWith('Anna.R', 'Anna', 'password-lunga')
    expect(router.currentRoute.value.path).toBe('/today')
    expect(wrapper.html()).not.toMatch(/email/i)
  })

  it('shows the sign-up error without navigating', async () => {
    auth.signUp.mockImplementation(async () => {
      auth.error.value = 'Account creato, ma l’accesso non è ancora abilitato.'
      return false
    })
    const { wrapper, router } = await mountPage('register')

    await wrapper.get('[name="username"]').setValue('anna')
    await wrapper.get('[name="displayName"]').setValue('Anna')
    await wrapper.get('[name="password"]').setValue('password-lunga')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('non è ancora abilitato')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('rejects an invalid username inline without sending a request', async () => {
    const { wrapper } = await mountPage('register')

    await wrapper.get('[name="username"]').setValue('anna rossi')
    await wrapper.get('[name="displayName"]').setValue('Anna')
    await wrapper.get('[name="password"]').setValue('password-lunga')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(auth.signUp).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('Il nome utente')
  })

  it('accepts a legacy email at login', async () => {
    auth.signIn.mockResolvedValue(true)
    const { wrapper, router } = await mountPage('login')

    await wrapper.get('[name="username"]').setValue('anna@example.test')
    await wrapper.get('[name="password"]').setValue('password-lunga')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(auth.signIn).toHaveBeenCalledWith('anna@example.test', 'password-lunga')
    expect(router.currentRoute.value.path).toBe('/today')
  })

  it('shows the admin hint and no recovery link at login', async () => {
    const { wrapper } = await mountPage('login')

    expect(wrapper.text()).toContain('Password dimenticata? Contatta l’amministratore.')
    expect(wrapper.find('a[href="/recover-password"]').exists()).toBe(false)
  })

  it('keeps login input available after an authentication error', async () => {
    auth.signIn.mockImplementation(async () => {
      auth.error.value = 'Credenziali non valide'
      return false
    })
    const { wrapper } = await mountPage('login')

    await wrapper.get('[name="username"]').setValue('anna')
    await wrapper.get('[name="password"]').setValue('sbagliata')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Credenziali non valide')
    expect((wrapper.get('[name="username"]').element as HTMLInputElement).value).toBe('anna')
  })
})
