import {
  createClient as createBrowserClient,
  SupabaseClient
} from '@supabase/supabase-js'

export function createUpload(): SupabaseClient {
  const supabase = createBrowserClient(
    process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
    process.env.EXPRESS_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return supabase
}
