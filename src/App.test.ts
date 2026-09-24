import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from './App.vue'
import StatisticsPage from './pages/StatisticsPage.vue'
import TodayPage from './pages/TodayPage.vue'

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
  it('renders the daily placeholder by default', async () => {
    expect((await mountAt('/')).text()).toContain('Mensa?')
  })

  it('navigates to statistics', async () => {
    const wrapper = await mountAt('/today')
    await wrapper.get('a[href="/statistics"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Grafico e classifica')
  })
})
