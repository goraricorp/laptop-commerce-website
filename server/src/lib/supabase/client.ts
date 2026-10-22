import {
  createClient as createBrowserClient,
  SupabaseClient
} from '@supabase/supabase-js'

/**
 * Creates a Supabase client for Express (server-side)
 * This is equivalent to Next.js createBrowserClient but for Express backend
 * 
 * Note: In Express, we typically use this for:
 * - Direct Supabase API calls (not user-specific)
 * - Use makeSupabaseForToken() or makeSupabaseForSession() for authenticated requests
 */
export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
    process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      realtime: {
        // websocket: ws,
        params: {
          eventsPerSecond: 20
        },
      },
      global: {
        headers: {
          'User-Agent': 'Express-Server',
        },
        fetch: (...args) => fetch(...args),
      },
    }
  )
}


/**
 * Creates a Supabase server client for Express with cookie-based session management.
 * Always create a new client within each request when using it.
 */
// export function createClient(
//   req: Request,
//   res: Response
// ): SupabaseClient {
//   return createServerClient(
//     process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
//     process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       auth: {
//         flowType: 'pkce',
//         autoRefreshToken: true,
//         persistSession: false,
//         detectSessionInUrl: false,
//       },
//       realtime: {
//         params: {
//           eventsPerSecond: 20
//         },
//       },
//       global: {
//         headers: {
//           'User-Agent': `Express-Server`,
//         },
//       },
//     }
//   )

//   // If you store the access token in a cookie, you can set it on the client so
//   // server-side requests are authenticated. Uncomment and adapt if needed:
//   // const token = req.cookies?.['sb-access-token'] || req.cookies?.['supabase-auth-token']
//   // if (token) {
//   //   // supabase-js exposes `auth.setAuth(token)` to attach an access token to the client
//   //   // (depending on your supabase-js version the method name may differ).
//   //   // ;(createClien.auth as any).setAuth?.(token)
//   // }

//   // return supabase
// }
