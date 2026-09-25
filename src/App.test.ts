import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import StatisticsPage from './pages/StatisticsPage.vue'
import TodayPage from './pages/TodayPage.vue'

vi.mock('./composables/useRealtimeSummary', () => ({
  useRealtimeSummary: () => ({
    onlineUserIds: { value: new Set<string>() },
    status: { value: 'connected' },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

vi.mock('./lib/supabase', () => ({
  getSupabase: () => ({
    rpc: vi.fn().mockImplementation(async (name: string) =>
      name === 'get_attendance_statistics'
        ? {
            data: {
              range: '30d',
              range_start: '2026-08-26',
              range_end: '2026-09-24',
              points: [],
              ranking: [],
            },
            error: null,
          }
        : todaySummary,
    ),
  }),
}))

const todaySummary = vi.hoisted(() => ({
  data: {
    service_date: '2026-09-24',
    own_declaration: null,
    preferred_transport_mode: null,
    participants: [],
    ride_demand: 0,
    passenger_supply: 0,
    missing_seats: 0,
  },
  error: null,
}))

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/today' },
      { path: '/today', component: TodayPage, meta: { shell: true } },
      { path: '/statistics', component: StatisticsPage, meta: { shell: true } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router] } })
}

describe('application shell', () => {
  it('renders the daily flow by default', async () => {
    const wrapper = await mountAt('/')
    await flushPromises()
    expect(wrapper.text()).toContain('Mensa?')
  })

  it('navigates to statistics', async () => {
    const wrapper = await mountAt('/today')
    await wrapper.get('a[href="/statistics"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="group"][aria-label="Intervallo temporale"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Andamento')
  })

  it('keeps every shell action in the semantic responsive navigation', async () => {
    const wrapper = await mountAt('/today')
    await flushPromises()

    const topbar = wrapper.get('.app-topbar')
    const navigation = topbar.get('.app-topbar__nav')
    expect(navigation.attributes('aria-label')).toBe('Navigazione principale')
    expect(navigation.get('a[href="/today"]').text()).toBe('Oggi')
    expect(navigation.get('a[href="/statistics"]').text()).toBe('Statistiche')
    expect(navigation.text()).toContain('Profilo')
    expect(navigation.text()).toContain('Esci')
  })
})
