// src/lib/env-validation.ts

export interface RequiredEnvVars {
  // Client-side (browser) environment variables
  NEXT_PUBLIC_SQUARE_APPLICATION_ID: string
  NEXT_PUBLIC_SQUARE_LOCATION_ID: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

export interface ServerEnvVars {
  // Server-side environment variables
  SQUARE_ACCESS_TOKEN: string
  SQUARE_ENVIRONMENT: 'sandbox' | 'production'
  SQUARE_LOCATION_ID: string
}

export interface EmailEnvVars {
  // Email system environment variables
  RESEND_API_KEY: string
  FROM_EMAIL: string
  ADMIN_EMAIL: string
  NEXT_PUBLIC_APP_URL: string
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
    nodeEnv: process.env.NODE_ENV,
  })

  const missingVars: string[] = []

  if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID')
  if (!env.NEXT_PUBLIC_SQUARE_LOCATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_LOCATION_ID')
  if (!env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars)
    console.error(
      'Available env vars:',
      Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    )
    throw new EnvironmentError(missingVars)
  }

  return env as RequiredEnvVars
}

/**
 * Validates server-side environment variables
 * Call this in server actions and API routes
 */
export function validateServerEnvironment(): ServerEnvVars {
  const missingVars: string[] = []
  
  const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN
  const squareEnvironment = process.env.SQUARE_ENVIRONMENT
  const squareLocationId = process.env.SQUARE_LOCATION_ID

  if (!squareAccessToken) {
    missingVars.push('SQUARE_ACCESS_TOKEN')
  }

  if (!squareEnvironment) {
    missingVars.push('SQUARE_ENVIRONMENT')
  } else if (!['sandbox', 'production'].includes(squareEnvironment)) {
    missingVars.push('SQUARE_ENVIRONMENT (must be "sandbox" or "production")')
  }

  if (!squareLocationId) {
    missingVars.push('SQUARE_LOCATION_ID')
  }

  if (missingVars.length > 0) {
    console.error('Missing server environment variables:', missingVars)
    throw new EnvironmentError(missingVars)
  }

  // Log warnings for missing email variables but don't fail
  const emailVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }

  const missingEmailVars = Object.entries(emailVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)
    
  if (missingEmailVars.length > 0) {
    console.warn(
      `Warning: Missing email environment variables: ${missingEmailVars.join(', ')}. Email notifications will be disabled.`
    )
  }

  return {
    SQUARE_ACCESS_TOKEN: squareAccessToken!,
    SQUARE_ENVIRONMENT: squareEnvironment as 'sandbox' | 'production',
    SQUARE_LOCATION_ID: squareLocationId!,
  }
}

/**
 * Validates email system environment variables
 * Call this when email functionality is needed
 */
export function validateEmailEnvironment(): EmailEnvVars {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL || 'noreply@empirefootballgroup.com'
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const missingVars: string[] = []

  if (!resendApiKey) missingVars.push('RESEND_API_KEY')
  if (!adminEmail) missingVars.push('ADMIN_EMAIL')
  if (!appUrl) missingVars.push('NEXT_PUBLIC_APP_URL')

  if (missingVars.length > 0) {
    throw new EnvironmentError(missingVars)
  }

  return {
    RESEND_API_KEY: resendApiKey!,
    FROM_EMAIL: fromEmail,
    ADMIN_EMAIL: adminEmail!,
    NEXT_PUBLIC_APP_URL: appUrl!,
  }
}

/**
 * Check if email functionality is available
 * Returns true if all email environment variables are set
 */
export function isEmailAvailable(): boolean {
  try {
    validateEmailEnvironment()
    return true
  } catch {
    return false
  }
}

/**
 * Gets the appropriate Square Web SDK URL based on environment
 */
export function getSquareWebSDKUrl(): string {
  const env = process.env.SQUARE_ENVIRONMENT || process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT

  // Type guard to ensure env is the correct type
  const isValidEnvironment = (env: string | undefined): env is 'sandbox' | 'production' => {
    return env === 'sandbox' || env === 'production'
  }

  if (isValidEnvironment(env) && env === 'production') {
    return 'https://web.squarecdn.com/v1/square.js'
  }

  // Default to sandbox if not production or undefined
  return 'https://sandbox.web.squarecdn.com/v1/square.js'
}

/**
 * Get environment variables with fallback for client-side
 * This is a safer way to get env vars in client components
 */
export function getClientEnvironment(): RequiredEnvVars {
  return {
    NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '',
    NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

interface EnvironmentInfo {
  nodeEnv: string | undefined
  squareEnvironment: string | undefined
  hasSquareAccess: boolean
  hasSquareLocation: boolean
  hasResendKey: boolean
  hasFromEmail: boolean
  hasAdminEmail: boolean
  hasAppUrl: boolean
  emailAvailable: boolean
}

/**
 * Get all environment information for debugging
 * Safe for logging (doesn't expose sensitive values)
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  return {
    nodeEnv: process.env.NODE_ENV,
    squareEnvironment: process.env.SQUARE_ENVIRONMENT,
    hasSquareAccess: !!process.env.SQUARE_ACCESS_TOKEN,
    hasSquareLocation: !!process.env.SQUARE_LOCATION_ID,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.FROM_EMAIL,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    emailAvailable: isEmailAvailable(),
  }
}