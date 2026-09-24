import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TodayPage from './TodayPage.vue'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))
vi.mock('../composables/useRealtimeSummary', () => ({
  useRealtimeSummary: () => ({
    onlineUserIds: { value: new Set<string>() },
    status: { value: 'connected' },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

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
  it('offers only the ride and car options', async () => {
    const wrapper = mount(TodayPage)
    await flushPromises()
    await wrapper.get('[data-answer="yes"]').trigger('click')

    const values = wrapper
      .findAll('input[name="transportMode"]')
      .map((input) => (input.element as HTMLInputElement).value)
    expect(values).toEqual(['needs_ride', 'offers_car'])
    expect(wrapper.text()).toContain('Ho bisogno di un passaggio')
    expect(wrapper.text()).toContain('Prendo la macchina')
    expect(wrapper.find('[value="autonomous"]').exists()).toBe(false)
  })

  it('defaults a legacy autonomous preference to asking for a ride', async () => {
    const wrapper = mount(TodayPage)
    await flushPromises()

    await wrapper.get('[data-answer="yes"]').trigger('click')
    expect((wrapper.get('[value="needs_ride"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('set_today_declaration', {
      p_attending: true,
      p_transport_mode: 'needs_ride',
    })
  })

  it('defaults to asking for a ride without a preference', async () => {
    rpc.mockResolvedValue({
      data: { ...unanswered, preferred_transport_mode: null },
      error: null,
    })
    const wrapper = mount(TodayPage)
    await flushPromises()

    await wrapper.get('[data-answer="yes"]').trigger('click')
    expect((wrapper.get('[value="needs_ride"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('saves a driver with the car capacity', async () => {
    rpc.mockResolvedValue({
      data: { ...unanswered, preferred_transport_mode: 'offers_car' },
      error: null,
    })
    const wrapper = mount(TodayPage)
    await flushPromises()

    await wrapper.get('[data-answer="yes"]').trigger('click')
    expect((wrapper.get('[value="offers_car"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('input[type="number"]').setValue(4)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('set_today_declaration', {
      p_attending: true,
      p_transport_mode: 'offers_car',
      p_car_capacity: 4,
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
    expect((wrapper.get('[value="needs_ride"]').element as HTMLInputElement).checked).toBe(true)
  })
})
