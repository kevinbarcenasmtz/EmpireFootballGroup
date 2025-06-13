import { Resend } from 'resend';
import { validateEmailEnvironment, isEmailAvailable } from '../env-validation';

// Create Resend client using existing validation
export function createResendClient() {
  const env = validateEmailEnvironment();
  return new Resend(env.RESEND_API_KEY);
}

// Email configuration using validated environment
export const emailConfig = {
  get fromEmail() {
    if (!isEmailAvailable()) {
      throw new Error('Email system not configured - missing environment variables');
    }
    const env = validateEmailEnvironment();
    return env.FROM_EMAIL;
  },
  
  get adminEmail() {
    if (!isEmailAvailable()) {
      throw new Error('Email system not configured - missing environment variables');
    }
    const env = validateEmailEnvironment();
    return env.ADMIN_EMAIL;
  },
  
  get appUrl() {
    if (!isEmailAvailable()) {
      throw new Error('Email system not configured - missing environment variables');
    }
    const env = validateEmailEnvironment();
    return env.NEXT_PUBLIC_APP_URL;
  },
  
  get supportEmail() {
    if (!isEmailAvailable()) {
      throw new Error('Email system not configured - missing environment variables');
    }
    const env = validateEmailEnvironment();
    // Check for SUPPORT_EMAIL first, fallback to ADMIN_EMAIL
    return process.env.SUPPORT_EMAIL || env.ADMIN_EMAIL;
  },
};

// Enhanced email sending wrapper with better error handling
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  // Early validation check
  if (!isEmailAvailable()) {
    console.warn('Email system not available - missing environment variables');
    return {
      success: false,
      error: 'Email system not configured. Please check environment variables.',
    };
  }

  // Validate email addresses
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  for (const email of recipients) {
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: `Invalid email address: ${email}`,
      };
    }
  }

  try {
    const resend = createResendClient();

    const result = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
      replyTo: options.replyTo || emailConfig.supportEmail,
    });

    console.log('Email sent successfully:', {
      id: result.data?.id,
      to: typeof options.to === 'string' ? options.to : options.to.join(', '),
      subject: options.subject,
      timestamp: new Date().toISOString(),
    });

    return { 
      success: true, 
      id: result.data?.id,
      message: 'Email sent successfully' 
    };

  } catch (error) {
    console.error('Failed to send email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: typeof options.to === 'string' ? options.to : options.to.join(', '),
      subject: options.subject,
      timestamp: new Date().toISOString(),
    });

    // Handle specific Resend API errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        return {
          success: false,
          error: 'Email service configuration error - invalid API key',
        };
      }
      
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Email rate limit exceeded - please try again later',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

// Helper function to check if email can be sent
export function canSendEmail(): boolean {
  return isEmailAvailable();
}

// Helper function to get email configuration safely (for debugging)
export function getEmailConfigStatus() {
  const available = isEmailAvailable();
  
  if (!available) {
    return {
      available: false,
      message: 'Email system not configured',
    };
  }

  try {
    return {
      available: true,
      fromEmail: emailConfig.fromEmail,
      adminEmail: emailConfig.adminEmail,
      appUrl: emailConfig.appUrl,
      supportEmail: emailConfig.supportEmail,
    };
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Configuration error',
    };
  }
}