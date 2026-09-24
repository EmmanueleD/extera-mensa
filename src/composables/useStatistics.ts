import { computed, ref, shallowRef } from 'vue'
import { getSupabase } from '../lib/supabase'
import {
  DEFAULT_STATISTICS_RANGE,
  STATISTICS_ERRORS,
  type StatisticsRange,
  type StatisticsResult,
} from '../lib/statistics'

const range = ref<StatisticsRange>(DEFAULT_STATISTICS_RANGE)
const result = shallowRef<StatisticsResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/** Owns attendance statistics state for the Statistics route. */
export function useStatistics() {
  const points = computed(() => result.value?.points ?? [])
  const ranking = computed(() => result.value?.ranking ?? [])
  const rangeStart = computed(() => result.value?.range_start ?? null)
  const rangeEnd = computed(() => result.value?.range_end ?? null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const response = await getSupabase().rpc('get_attendance_statistics', {
        p_range: range.value,
      })
      if (response.error || !response.data) {
        error.value = STATISTICS_ERRORS.LOAD
        return false
      }
      result.value = response.data as unknown as StatisticsResult
      return true
    } catch {
      error.value = STATISTICS_ERRORS.CONNECTION
      return false
    } finally {
      loading.value = false
    }
  }

  /** Selects a range and reloads so chart, details, and ranking stay synchronized. */
  async function setRange(next: StatisticsRange) {
    if (next === range.value) return true
    range.value = next
    return load()
  }

  return { range, result, points, ranking, rangeStart, rangeEnd, loading, error, load, setRange }
}
