import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TodayPage from './TodayPage.vue'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))

const unanswered = {
  service_date: '2026-09-24',
  own_declaration: null,
  preferred_transport_mode: 'autonomous',
  participants: [],
  ride_demand: 0,
  passenger_supply: 0,
  missing_seats: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockResolvedValue({ data: unanswered, error: null })
})

describe('TodayPage', () => {
  it('saves an attending user with one transport mode', async () => {
    const wrapper = mount(TodayPage)
    await flushPromises()

    await wrapper.get('[data-answer="yes"]').trigger('click')
    expect((wrapper.get('[value="autonomous"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('set_today_declaration', {
      p_attending: true,
      p_transport_mode: 'autonomous',
    })
  })

  it('saves no without asking transport questions', async () => {
    const wrapper = mount(TodayPage)
    await flushPromises()
    await wrapper.get('[data-answer="no"]').trigger('click')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('set_today_declaration', {
      p_attending: false,
    })
  })

  it('preserves the selected mode after a connection failure', async () => {
    const wrapper = mount(TodayPage)
    await flushPromises()
    rpc.mockRejectedValueOnce(new Error('offline'))

    await wrapper.get('[data-answer="yes"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Connessione non disponibile')
    expect((wrapper.get('[value="autonomous"]').element as HTMLInputElement).checked).toBe(true)
  })
})
