import { computed, ref } from 'vue'
import { getSupabase } from '../lib/supabase'
import type { Database } from '../types/database'

type TransportMode = Database['public']['Enums']['transport_mode']
type Declaration = Database['public']['Tables']['daily_declarations']['Row']

export interface Participant {
  id: string
  display_name: string
  message: string | null
  avatar_seed: string
  avatar_color: string
  message_text_color: string
  transport_mode: TransportMode
  car_capacity: number | null
}

export interface TodayState {
  service_date: string
  own_declaration: Declaration | null
  preferred_transport_mode: TransportMode | null
  participants: Participant[]
  ride_demand: number
  passenger_supply: number
  missing_seats: number
}

const state = ref<TodayState | null>(null)
const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const error = ref<string | null>(null)
const answered = computed(() => Boolean(state.value?.own_declaration))

export function useToday() {
  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await getSupabase().rpc('get_today_state')
      if (result.error || !result.data) {
        error.value = 'Non è stato possibile caricare la giornata.'
        return false
      }
      state.value = result.data as unknown as TodayState
      return true
    } catch {
      error.value = 'Connessione non disponibile. Riprova.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function save(
    attending: boolean,
    transportMode: TransportMode | null = null,
    carCapacity: number | null = null,
  ) {
    saving.value = true
    error.value = null
    const args: Record<string, boolean | string | number> = { p_attending: attending }
    if (attending && transportMode) args.p_transport_mode = transportMode
    if (attending && transportMode === 'offers_car' && carCapacity !== null) {
      args.p_car_capacity = carCapacity
    }
    try {
      const result = await getSupabase().rpc(
        'set_today_declaration',
        args as Database['public']['Functions']['set_today_declaration']['Args'],
      )
      if (result.error) {
        error.value = 'Non è stato possibile salvare. Riprova.'
        return false
      }
      const loaded = await load()
      if (loaded) editing.value = false
      return loaded
    } catch {
      error.value = 'Connessione non disponibile. Riprova.'
      return false
    } finally {
      saving.value = false
    }
  }

  function startEditing() {
    editing.value = true
  }

  return { state, loading, saving, editing, error, answered, load, save, startEditing }
}
