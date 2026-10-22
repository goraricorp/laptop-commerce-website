import {
  createClient as createServerClient,
  type SupabaseClient,
  type User,
  type Session
} from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

// Extend Express Request type to include Supabase properties
declare global {
  namespace Express {
    interface Request {
      supabase?: SupabaseClient
      user?: User | null
      authSession?: Session | null  // Use authSession to avoid conflict with express-session
    }
  }
}

/**
 * Express middleware to manage Supabase session with cookies
 * This replaces Next.js updateSession middleware
 * 
 * Usage:
 * import { supabaseSessionMiddleware } from '@/lib/supabase/middleware'
 * app.use(supabaseSessionMiddleware)
 */
export async function supabaseSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Always create a new client on each request (similar to Next.js approach)
    const supabase = createServerClient(
      process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
      process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'User-Agent': 'Express-Server',
          },
        },
      }
    )

    // Get cookies from request
    const accessToken = req.cookies?.['access_token'] || req.cookies?.['sb-access-token']
    const refreshToken = req.cookies?.['refresh_token'] || req.cookies?.['sb-refresh-token']

    let user: User | null = null
    let session: Session | null = null

    // Try to get user with access token
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken)
      
      if (!error && data.user) {
        user = data.user
        session = null  // We don't have full session info from getUser
      } else if (refreshToken) {
        // Access token expired, try to refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken
        })

        if (!refreshError && refreshData.session) {
          user = refreshData.user
          session = refreshData.session

          // Update cookies with new tokens
          res.cookie('access_token', refreshData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 55 * 60 * 1000, // 55 minutes
          })

          if (refreshData.session.refresh_token) {
            res.cookie('refresh_token', refreshData.session.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            })
          }
        }
      }
    }

    // Attach user and session to request object
    req.supabase = supabase
    req.user = user
    req.authSession = session

    next()
  } catch (error) {
    console.error('Supabase session middleware error:', error)
    next()
  }
}

/**
 * Express middleware to require authentication
 * Use this on protected routes
 * 
 * Usage:
 * import { requireAuth } from '@/lib/supabase/middleware'
 * router.get('/protected', requireAuth, (req, res) => { ... })
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  next()
}

/**
 * Express middleware to optionally check authentication
 * Similar to Next.js middleware but for specific routes
 * 
 * Usage:
 * import { optionalAuth } from '@/lib/supabase/middleware'
 * router.get('/api/data', optionalAuth, (req, res) => {
 *   const user = req.user // may be null
 * })
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Just continue - user will be attached if available
  next()
}

/**
 * Express middleware to redirect if not authenticated
 * Similar to Next.js middleware redirect behavior
 * 
 * Usage:
 * import { redirectIfNotAuth } from '@/lib/supabase/middleware'
 * router.get('/dashboard', redirectIfNotAuth('/login'), (req, res) => { ... })
 */
export function redirectIfNotAuth(redirectTo: string = '/sign-in') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user) {
      return res.redirect(redirectTo)
    }

    next()
  }
}

/**
 * Express middleware to check user role
 * 
 * Usage:
 * import { requireRole } from '@/lib/supabase/middleware'
 * router.post('/admin/action', requireRole(['admin']), (req, res) => { ... })
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Get user role from metadata or database
    const userRole = user.app_metadata?.role || user.user_metadata?.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}
