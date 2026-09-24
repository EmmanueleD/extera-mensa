import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage.vue'

const auth = vi.hoisted(() => ({
  error: { value: null as string | null },
  loading: { value: false },
  signIn: vi.fn(),
  signUp: vi.fn(),
  recoverPassword: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock('../composables/useAuth', () => ({ useAuth: () => auth }))

async function mountPage(mode: 'login' | 'register' | 'recover' | 'update-password') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/today', component: { template: '<div />' } },
      { path: '/register', component: { template: '<div />' } },
      { path: '/recover-password', component: { template: '<div />' } },
      { path: '/verify-email', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return mount(AuthPage, { props: { mode }, global: { plugins: [router] } })
}

beforeEach(() => {
  auth.error.value = null
  auth.loading.value = false
  vi.clearAllMocks()
})

describe('AuthPage', () => {
  it('registers with the display name and redirects to verification', async () => {
    auth.signUp.mockResolvedValue(true)
    const wrapper = await mountPage('register')

    await wrapper.get('[name="displayName"]').setValue('Anna')
    await wrapper.get('[name="email"]').setValue('anna@example.test')
    await wrapper.get('[name="password"]').setValue('password-lunga')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(auth.signUp).toHaveBeenCalledWith('Anna', 'anna@example.test', 'password-lunga')
    expect(wrapper.html()).toContain('Controlla la tua email')
  })

  it('keeps login input available after an authentication error', async () => {
    auth.signIn.mockImplementation(async () => {
      auth.error.value = 'Credenziali non valide'
      return false
    })
    const wrapper = await mountPage('login')

    await wrapper.get('[name="email"]').setValue('anna@example.test')
    await wrapper.get('[name="password"]').setValue('sbagliata')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Credenziali non valide')
    expect((wrapper.get('[name="email"]').element as HTMLInputElement).value).toBe(
      'anna@example.test',
    )
  })
})
