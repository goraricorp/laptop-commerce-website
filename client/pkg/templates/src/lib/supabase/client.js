import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let browserClient

export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export function createClient() {
  if (browserClient) return browserClient

  const { anonKey, url } = getSupabaseConfig()
  if (!url || !anonKey) {
    throw new Error(
      'Chưa cấu hình VITE_PUBLIC_SUPABASE_URL và VITE_PUBLIC_SUPABASE_ANON_KEY cho client.',
    )
  }

  browserClient = createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  return browserClient
}
