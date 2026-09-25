import { ref } from 'vue'
import { getSupabase } from '../lib/supabase'
import { mapProfileUpdateError, PROFILE_ERRORS } from '../lib/profile'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

/** Owner-writable fields. Row Level Security still restricts the row to self. */
export type ProfileUpdate = Partial<
  Pick<Profile, 'display_name' | 'message' | 'avatar_seed' | 'avatar_color' | 'message_text_color'>
>

const profile = ref<Profile | null>(null)
const open = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

export function useProfile() {
  async function load() {
    const userId = useAuth().user.value?.id
    if (!userId) {
      error.value = PROFILE_ERRORS.SESSION
      return false
    }
    loading.value = true
    error.value = null
    try {
      const result = await getSupabase().from('profiles').select('*').eq('id', userId).single()
      if (result.error || !result.data) {
        error.value = PROFILE_ERRORS.LOAD
        return false
      }
      profile.value = result.data
      return true
    } catch {
      error.value = PROFILE_ERRORS.CONNECTION
      return false
    } finally {
      loading.value = false
    }
  }

  async function update(changes: ProfileUpdate) {
    const userId = useAuth().user.value?.id
    if (!userId) {
      error.value = PROFILE_ERRORS.SESSION
      return false
    }
    saving.value = true
    error.value = null
    try {
      const result = await getSupabase()
        .from('profiles')
        .update(changes)
        .eq('id', userId)
        .select()
        .single()
      if (result.error || !result.data) {
        error.value = mapProfileUpdateError(result.error)
        return false
      }
      profile.value = result.data
      return true
    } catch {
      error.value = PROFILE_ERRORS.CONNECTION
      return false
    } finally {
      saving.value = false
    }
  }

  function resetError() {
    error.value = null
  }

  function openDrawer() {
    open.value = true
  }

  function closeDrawer() {
    open.value = false
  }

  return {
    profile,
    open,
    loading,
    saving,
    error,
    load,
    update,
    resetError,
    openDrawer,
    closeDrawer,
  }
}
