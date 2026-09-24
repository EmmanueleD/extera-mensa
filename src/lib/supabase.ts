import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

let client: SupabaseClient<Database> | undefined

export function getSupabase() {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase public environment variables')

  client = createClient<Database>(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}
