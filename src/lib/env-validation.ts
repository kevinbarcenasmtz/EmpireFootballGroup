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

export interface EmailEnvVars {
  // Email system environment variables
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  ADMIN_EMAIL: string;
  NEXT_PUBLIC_APP_URL: string;
}

export class EnvironmentError extends Error {
  constructor(missingVars: string[]) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates client-side environment variables
 * Call this in components that need Square SDK
 */
export function validateClientEnvironment(): RequiredEnvVars {
  // For client-side, we need to check both process.env and window location
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const env = {
    NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
    NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  console.log('Environment check:', {
    isDevelopment,
    hasSquareAppId: !!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
    hasSquareLocationId: !!env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
  });

  const missingVars: string[] = [];

  if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID');
  if (!env.NEXT_PUBLIC_SQUARE_LOCATION_ID) missingVars.push('NEXT_PUBLIC_SQUARE_LOCATION_ID');
  if (!env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    console.error(
      'Available env vars:',
      Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    );
    throw new EnvironmentError(missingVars);
  }

  return env as RequiredEnvVars;
}

/**
 * Validates server-side environment variables
 * Call this in server actions and API routes
 */
export function validateServerEnvironment(): ServerEnvVars {
  const requiredVars: (keyof ServerEnvVars)[] = [
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_ENVIRONMENT',
    'SQUARE_LOCATION_ID',
  ];

  const missingVars: string[] = [];
  const env: Partial<ServerEnvVars> = {};

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      if (varName === 'SQUARE_ENVIRONMENT' && !['sandbox', 'production'].includes(value)) {
        missingVars.push(`${varName} (must be 'sandbox' or 'production')`);
      } else {
        env[varName] =
          varName === 'SQUARE_ENVIRONMENT' ? (value as 'sandbox' | 'production') : value;
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('Missing server environment variables:', missingVars);
    throw new EnvironmentError(missingVars);
  }

  // Log warnings for missing email variables but don't fail
  const emailVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missingEmailVars = Object.entries(emailVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missingEmailVars.length > 0) {
    console.warn(
      `Warning: Missing email environment variables: ${missingEmailVars.join(', ')}. Email notifications will be disabled.`
    );
  }

  return env as ServerEnvVars;
}

/**
 * Validates email system environment variables
 * Call this when email functionality is needed
 */
export function validateEmailEnvironment(): EmailEnvVars {
  const requiredVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@empirefootballgroup.com',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => {
      // FROM_EMAIL has a default, so only check if it's explicitly empty
      if (key === 'FROM_EMAIL') return false;
      return !value;
    })
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new EnvironmentError(missingVars);
  }

  return requiredVars as EmailEnvVars;
}

/**
 * Check if email functionality is available
 * Returns true if all email environment variables are set
 */
export function isEmailAvailable(): boolean {
  try {
    validateEmailEnvironment();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the appropriate Square Web SDK URL based on environment
 */
export function getSquareWebSDKUrl(): string {
  const env =
    process.env.SQUARE_ENVIRONMENT || process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

  return env === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';
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
  };
}

/**
 * Get all environment information for debugging
 * Safe for logging (doesn't expose sensitive values)
 */
export function getEnvironmentInfo() {
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
  };
}
