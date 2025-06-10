// src/lib/env-validation.ts
export interface RequiredEnvVars {
    // Client-side (browser) environment variables
    NEXT_PUBLIC_SQUARE_APPLICATION_ID: string;
    NEXT_PUBLIC_SQUARE_LOCATION_ID: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
  
  export interface ServerEnvVars {
    // Server-side environment variables
    SQUARE_ACCESS_TOKEN: string;
    SQUARE_ENVIRONMENT: 'sandbox' | 'production';
    SQUARE_LOCATION_ID: string;
  }
  
  export class EnvironmentError extends Error {
    constructor(missingVars: string[]) {
      super(`Missing required environment variables: ${missingVars.join(', ')}`)
      this.name = 'EnvironmentError'
    }
  }
  
  /**
   * Validates client-side environment variables
   * Call this in components that need Square SDK
   */
  export function validateClientEnvironment(): RequiredEnvVars {
    // For client-side, we need to check both process.env and window location
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    
    const env = {
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  
    console.log('Environment check:', {
      isDevelopment,
      hasSquareAppId: !!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      hasSquareLocationId: !!env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    })
  
    const missingVars: string[] = []
    
    if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID')
    if (!env.NEXT_PUBLIC_SQUARE_LOCATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_LOCATION_ID')
    if (!env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars)
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))
      throw new EnvironmentError(missingVars)
    }
  
    return env as RequiredEnvVars
  }
  
  /**
   * Validates server-side environment variables
   * Call this in server actions and API routes
   */
  export function validateServerEnvironment(): ServerEnvVars {
    const requiredVars: (keyof ServerEnvVars)[] = [
      'SQUARE_ACCESS_TOKEN',
      'SQUARE_ENVIRONMENT',
      'SQUARE_LOCATION_ID'
    ]
  
    const missingVars: string[] = []
    const env: Partial<ServerEnvVars> = {}
  
    requiredVars.forEach(varName => {
      const value = process.env[varName]
      if (!value) {
        missingVars.push(varName)
      } else {
        if (varName === 'SQUARE_ENVIRONMENT' && !['sandbox', 'production'].includes(value)) {
          missingVars.push(`${varName} (must be 'sandbox' or 'production')`)
        } else {
          env[varName] = value as any
        }
      }
    })
  
    if (missingVars.length > 0) {
      console.error('Missing server environment variables:', missingVars)
      throw new EnvironmentError(missingVars)
    }
  
    return env as ServerEnvVars
  }
  
  /**
   * Gets the appropriate Square Web SDK URL based on environment
   */
  export function getSquareWebSDKUrl(): string {
    const env = process.env.SQUARE_ENVIRONMENT || process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox'
    
    return env === 'production' 
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'
  }
  
  /**
   * Get environment variables with fallback for client-side
   * This is a safer way to get env vars in client components
   */
  export function getClientEnvironment() {
    return {
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '',
      NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  }