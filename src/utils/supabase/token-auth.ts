// Token-based authentication utilities (Cloudflare Worker pattern)

export interface TokenValidationResult {
    valid: boolean;
    user?: {
      id: string;
      email: string;
      [key: string]: any;
    };
    error?: string;
  }
  
  /**
   * Validate Supabase access token using direct API call
   * This avoids creating Supabase client during build time
   */
  export async function validateSupabaseToken(accessToken: string): Promise<TokenValidationResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        valid: false,
        error: 'Supabase configuration missing',
      };
    }
  
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        return {
          valid: false,
          error: `Token validation failed: ${response.status}`,
        };
      }
  
      const user = await response.json();
      return {
        valid: true,
        user,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }
  
  /**
   * Extract access token from request headers or cookies
   */
  export function extractAccessToken(request: Request): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
  
    // Check cookies (multiple possible names)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);
  
      return cookies['sb-access-token'] || 
             cookies['supabase.auth.token'] || 
             cookies['supabase-auth-token'] || 
             null;
    }
  
    return null;
  }
  
  /**
   * Create an authenticated fetch wrapper for API routes
   */
  export function createAuthenticatedFetch(accessToken: string) {
    return (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    };
  }
  
  /**
   * Server-side token validation for API routes
   */
  export async function validateRequestAuth(request: Request): Promise<TokenValidationResult> {
    const accessToken = extractAccessToken(request);
    
    if (!accessToken) {
      return {
        valid: false,
        error: 'No access token provided',
      };
    }
  
    return validateSupabaseToken(accessToken);
  }