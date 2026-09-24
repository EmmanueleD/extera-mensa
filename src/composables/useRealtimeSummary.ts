import type { RealtimeChannel } from '@supabase/supabase-js'
import { ref } from 'vue'
import { getSupabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

const onlineUserIds = ref<Set<string>>(new Set())
const status = ref<RealtimeStatus>('disconnected')
let channel: RealtimeChannel | undefined
let reloadTimer: ReturnType<typeof setTimeout> | undefined
let reloadSummary: (() => Promise<unknown>) | undefined

function scheduleReload() {
  if (!reloadSummary) return
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => void reloadSummary?.(), 100)
}

function syncPresence() {
  if (!channel) return
  onlineUserIds.value = new Set(Object.keys(channel.presenceState()))
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') scheduleReload()
}

export function useRealtimeSummary() {
  function start(reload: () => Promise<unknown>) {
    if (channel) return
    const userId = useAuth().user.value?.id
    if (!userId) return

    reloadSummary = reload
    status.value = 'connecting'
    channel = getSupabase()
      .channel('cafeteria:global', {
        config: { private: true, presence: { key: userId } },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_declarations' },
        scheduleReload,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleReload)
      .on('presence', { event: 'sync' }, syncPresence)
      .subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') {
          status.value = 'connected'
          void channel?.track({ user_id: userId })
        } else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
          status.value = 'reconnecting'
        } else if (nextStatus === 'CLOSED') {
          status.value = 'disconnected'
        }
      })
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  async function stop() {
    clearTimeout(reloadTimer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (channel) await channel.unsubscribe()
    channel = undefined
    reloadSummary = undefined
    onlineUserIds.value = new Set()
    status.value = 'disconnected'
  }

  return { onlineUserIds, status, start, stop }
}
