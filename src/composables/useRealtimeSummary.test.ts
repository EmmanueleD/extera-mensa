import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealtimeSummary } from './useRealtimeSummary'

const handlers = vi.hoisted(() => new Map<string, () => void>())
const track = vi.hoisted(() => vi.fn())
const unsubscribe = vi.hoisted(() => vi.fn())
const subscribe = vi.hoisted(() => vi.fn())
const presenceState = vi.hoisted(() => vi.fn())
const channel = vi.hoisted(() => ({
  on: vi.fn((type: string, filter: Record<string, string>, callback: () => void) => {
    handlers.set(`${type}:${filter.table ?? filter.event}`, callback)
    return channel
  }),
  subscribe: vi.fn((callback: (status: string) => void) => {
    subscribe(callback)
    return channel
  }),
  track,
  unsubscribe,
  presenceState,
}))

vi.mock('../lib/supabase', () => ({
  getSupabase: () => ({ channel: () => channel }),
}))
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: { value: { id: 'anna' } } }),
}))

describe('useRealtimeSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    handlers.clear()
    presenceState.mockReturnValue({
      anna: [{ presence_ref: '1' }, { presence_ref: '2' }],
      luca: [{}],
    })
  })

  it('tracks one presence per user and debounces authoritative reloads', async () => {
    const reload = vi.fn().mockResolvedValue(true)
    const realtime = useRealtimeSummary()
    realtime.start(reload)

    const subscriptionCallback = subscribe.mock.calls[0][0]
    subscriptionCallback('SUBSCRIBED')
    expect(track).toHaveBeenCalledWith({ user_id: 'anna' })

    handlers.get('presence:sync')?.()
    expect([...realtime.onlineUserIds.value]).toEqual(['anna', 'luca'])

    handlers.get('postgres_changes:daily_declarations')?.()
    handlers.get('postgres_changes:profiles')?.()
    await vi.advanceTimersByTimeAsync(150)
    expect(reload).toHaveBeenCalledTimes(1)

    await realtime.stop()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
