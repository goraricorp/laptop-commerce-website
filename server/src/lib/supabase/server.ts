import { createServerClient } from '@supabase/ssr'
import { Request, Response } from 'express'
// import { cookies } from 'next/headers'

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createServer(req: Request, res: Response) {
  const cookieStore = req.cookies as Record<string, string> | undefined;
  // const cookieStore = await cookies()

  return createServerClient(
    process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
    process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (!cookieStore) return [];
          return Object.entries(cookieStore).map(([name, value]) => ({ name, value }));
          // return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookie(name, value, options);
              // cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// function createSupabaseServerClient(req: Request, res: Response) {
//   return createServerClient(
//     process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
//     process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => {
//           const cookies = (req as any).cookies as Record<string, string> | undefined;
//           if (!cookies) return [];
//           return Object.entries(cookies).map(([name, value]) => ({ name, value }));
//         },
//         setAll: (cookies) => {
//           cookies.forEach(({ name, value, options }) => {
//             res.cookie(name, value, options);
//           });
//         },
//       },
//     }
//   );
// }

// import { createClient as createSupabaseClient } from '@supabase/supabase-js'
// import { Request, Response } from 'express'
//
// /**
//  * Creates a Supabase server client for Express with cookie-based session management.
//  * Always create a new client within each function when using it.
//  */
// export function createClient(req: Request, res: Response) {
//   return createSupabaseClient(
//     process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
//     process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       auth: {
//         autoRefreshToken: true,
//         persistSession: false,
//         detectSessionInUrl: false,
//       },
//       global: {
//         headers: {
//           'User-Agent': `Express-Server`,
//         },
//       },
//   )
// }


// import {
//   createClient as createServerClient,
//   SupabaseClient
// } from '@supabase/supabase-js'
// import { createClient } from "@/lib/supabase/client";

// /**
//  * Creates authenticated Supabase client from access token
//  * Use this in middlewares/controllers when you have user's access token
//  */
// export function createToken(accessToken: string) {
//   if (!accessToken) return createClient();

//   const supabase = createServerClient(
//     process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
//     process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       auth: {
//         flowType: 'pkce',
//         autoRefreshToken: false,
//         persistSession: false,
//         detectSessionInUrl: false,
//       },
//       global: {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       },
//       realtime: {
//         params: {
//           eventsPerSecond: 20
//         },
//       },
//     }
//   )

//   // Update token for realtime
//   try {
//     supabase.realtime.setAuth(accessToken)
//   } catch {}

//   return supabase
// }

// /**
//  * Creates authenticated Supabase client with session (access + refresh token)
//  * Use this for long-running connections or realtime subscriptions
//  */
// export async function createSession(
//   accessToken: string,
//   refreshToken: string
// ) {
//   const supabase = createServerClient(
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
//     }
//   )

//   // Set session
//   await supabase.auth.setSession({
//     access_token: accessToken,
//     refresh_token: refreshToken,
//   })

//   // Sync new tokens to realtime on refresh
//   supabase.auth.onAuthStateChange((
//     _event,
//     session
//   ) => {
//     if (session?.access_token) {
//       try {
//         supabase.realtime.setAuth(session.access_token)
//       } catch {}
//     }
//   })

//   return supabase
// }

// // ---- 4) Verify OTP với token_hash (hash token) ----
// //  - Dùng cho email verification, password reset, magic link
// //  - token_hash được gửi qua email trong URL (parameter: code hoặc token_hash)
// //  - type: 'email' | 'recovery' | 'invite' | 'email_change'
// export async function verifyOtpWithHash(params: {
//   token_hash: string;
//   type: 'email' | 'recovery' | 'invite' | 'email_change';
// }): Promise<{
//   user: any;
//   session: any;
// }> {
//   const { token_hash, type } = params;

//   const { data, error } = await createClient().auth.verifyOtp({
//     token_hash,
//     type,
//   });

//   if (error) {
//     throw new Error(`Verify OTP failed: ${error.message}`);
//   }

//   if (!data.user || !data.session) {
//     throw new Error('Verify OTP failed: No user or session returned');
//   }

//   return {
//     user: data.user,
//     session: data.session,
//   };
// }

// // ---- 5) Verify OTP với email + token (6-digit code) ----
// //  - Dùng cho email verification với mã 6 số
// //  - Thường dùng khi bạn tự gửi email chứa mã OTP
// export async function verifyOtpWithToken(params: {
//   email: string;
//   token: string;
//   type: 'email' | 'recovery' | 'invite' | 'email_change';
// }): Promise<{
//   user: any;
//   session: any;
// }> {
//   const { email, token, type } = params;

//   const { data, error } = await createClient().auth.verifyOtp({
//     email,
//     token,
//     type,
//   });

//   if (error) {
//     throw new Error(`Verify OTP failed: ${error.message}`);
//   }

//   if (!data.user || !data.session) {
//     throw new Error('Verify OTP failed: No user or session returned');
//   }

//   return {
//     user: data.user,
//     session: data.session,
//   };
// }

// // ---- 6) Refresh session với refresh token ----
// //  - Lấy access token mới khi access token hết hạn
// //  - Trả về session mới với access_token và refresh_token mới
// export async function refreshSession(refreshToken: string): Promise<{
//   user: any;
//   session: any;
// }> {
//   const { data, error } = await createClient().auth.refreshSession({
//     refresh_token: refreshToken,
//   });

//   if (error) {
//     throw new Error(`Refresh session failed: ${error.message}`);
//   }

//   if (!data.session) {
//     throw new Error('Refresh session failed: No session returned');
//   }

//   return {
//     user: data.user,
//     session: data.session,
//   };
// }

// // ---- 7) Helper: Tạo client với bất kỳ loại token nào ----
// //  - Tự động detect và sử dụng token phù hợp
// export async function createClientWithAuth(params: {
//   accessToken?: string;
//   refreshToken?: string;
//   tokenHash?: string;
//   email?: string;
//   tokenType?: 'email' | 'recovery' | 'invite' | 'email_change';
// }): Promise<{
//   client: SupabaseClient;
//   user?: any;
//   session?: any;
// }> {
//   // Case 1: Có access + refresh token → tạo session client
//   if (params.accessToken && params.refreshToken) {
//     const client = await createSession(params.accessToken, params.refreshToken);
//     const { data } = await client.auth.getUser();
//     return {
//       client,
//       user: data.user,
//       session: { access_token: params.accessToken, refresh_token: params.refreshToken },
//     };
//   }

//   // Case 2: Chỉ có access token → tạo token client
//   if (params.accessToken) {
//     const client = createToken(params.accessToken);
//     const { data } = await client.auth.getUser();
//     return {
//       client,
//       user: data.user,
//       session: { access_token: params.accessToken },
//     };
//   }

//   // Case 3: Có token_hash → verify và tạo session
//   if (params.tokenHash && params.tokenType) {
//     const { user, session } = await verifyOtpWithHash({
//       token_hash: params.tokenHash,
//       type: params.tokenType,
//     });
//     const client = await createSession(
//       session.access_token,
//       session.refresh_token
//     );
//     return { client, user, session };
//   }

//   // Case 4: Có email + token (6-digit) → verify và tạo session
//   if (params.email && params.accessToken && params.tokenType) {
//     const { user, session } = await verifyOtpWithToken({
//       email: params.email,
//       token: params.accessToken,
//       type: params.tokenType,
//     });
//     const client = await createSession(
//       session.access_token,
//       session.refresh_token
//     );
//     return { client, user, session };
//   }

//   // Case 5: Chỉ có refresh token → refresh và tạo session
//   if (params.refreshToken) {
//     const { user, session } = await refreshSession(params.refreshToken);
//     const client = await createSession(
//       session.access_token,
//       session.refresh_token
//     );
//     return { client, user, session };
//   }

//   // Default: trả về client mặc định (anonymous)
//   return { client: createClient() };
// }