import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatisticsPage from './StatisticsPage.vue'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))

// The canvas chart is decorative; accessible behavior lives in the page fallback.
vi.mock('../components/statistics/StatisticsChart.vue', () => ({
  default: {
    name: 'StatisticsChart',
    props: ['points', 'selectedDate'],
    emits: ['select'],
    template: '<div data-testid="chart-stub"></div>',
  },
}))

const participants = [
  {
    id: 'anna',
    display_name: 'Anna',
    message: null,
    avatar_seed: 'seed-anna',
    avatar_color: 'coral',
    message_text_color: 'ink',
  },
  {
    id: 'luca',
    display_name: 'Luca',
    message: null,
    avatar_seed: 'seed-luca',
    avatar_color: 'teal',
    message_text_color: 'ink',
  },
]

const sample = {
  range: '30',
  range_start: '2026-09-01',
  range_end: '2026-09-03',
  points: [
    { service_date: '2026-09-01', attending_count: 0, participants: [] },
    { service_date: '2026-09-02', attending_count: 1, participants: [participants[1]] },
    { service_date: '2026-09-03', attending_count: 2, participants: participants },
  ],
  ranking: [
    {
      id: 'anna',
      display_name: 'Anna',
      avatar_seed: 'seed-anna',
      avatar_color: 'coral',
      attendance_count: 2,
    },
    {
      id: 'luca',
      display_name: 'Luca',
      avatar_seed: 'seed-luca',
      avatar_color: 'teal',
      attendance_count: 1,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockImplementation((_name: string, args: { p_range: string }) =>
    Promise.resolve({ data: { ...sample, range: args.p_range }, error: null }),
  )
})

describe('StatisticsPage', () => {
  it('defaults to the 30-day range and loads it', async () => {
    const wrapper = mount(StatisticsPage)
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('get_attendance_statistics', { p_range: '30' })
    expect(wrapper.get('.statistics-page').classes()).toContain('statistics-page')
    const range = wrapper.get('.statistics-range')
    expect(range.attributes('aria-label')).toBe('Intervallo temporale')
    expect(range.findAll('button')).toHaveLength(4)
    expect(wrapper.get('[data-range="30"]').attributes('aria-pressed')).toBe('true')
  })

  it('updates chart, details, and ranking together when the range changes', async () => {
    const wrapper = mount(StatisticsPage)
    await flushPromises()

    await wrapper.get('[data-range="7"]').trigger('click')
    await flushPromises()

    expect(rpc).toHaveBeenLastCalledWith('get_attendance_statistics', { p_range: '7' })
    expect(wrapper.get('[data-range="7"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-range="30"]').attributes('aria-pressed')).toBe('false')
    // The same result feeds both the ranking and the detail control.
    expect(wrapper.get('ol').text()).toContain('Anna')
    expect(wrapper.get('select').findAll('option')).toHaveLength(3)
  })

  it('presents attending profiles with names and avatars for the selected date', async () => {
    const wrapper = mount(StatisticsPage)
    await flushPromises()

    const detail = wrapper.get('[aria-live="polite"]')
    expect(detail.text()).toContain('Anna')
    expect(detail.text()).toContain('Luca')
    expect(detail.findAll('svg')).toHaveLength(2)
  })

  it('lets a keyboard or touch user pick a date through the accessible control', async () => {
    const wrapper = mount(StatisticsPage)
    await flushPromises()

    await wrapper.get('select').setValue('2026-09-02')
    await flushPromises()

    const detail = wrapper.get('[aria-live="polite"]')
    expect(detail.text()).toContain('Luca')
    expect(detail.text()).not.toContain('Anna')
  })

  it('orders the ranking by attendance totals', async () => {
    const wrapper = mount(StatisticsPage)
    await flushPromises()

    const items = wrapper.findAll('ol > li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Anna')
    expect(items[0].text()).toContain('2 presenze')
    expect(items[1].text()).toContain('Luca')
    expect(items[1].text()).toContain('1 presenza')
    expect(items.every((item) => item.classes().includes('statistics-ranking__row'))).toBe(true)
  })

  it('shows an empty state when the range has no data', async () => {
    rpc.mockResolvedValueOnce({
      data: {
        range: '30',
        range_start: '2026-09-03',
        range_end: '2026-09-03',
        points: [],
        ranking: [],
      },
      error: null,
    })

    const wrapper = mount(StatisticsPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Non ci sono ancora dati da mostrare.')
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('surfaces a recoverable load error', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })

    const wrapper = mount(StatisticsPage)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Non è stato possibile caricare')
  })
})
