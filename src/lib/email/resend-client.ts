import { Resend } from 'resend';

// Validate environment variables
function validateEmailEnvironment() {
  const requiredVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@empirefootballgroup.com',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  };

  const missing = Object.entries(requiredVars)
    .filter(([value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }

  return requiredVars as Record<keyof typeof requiredVars, string>;
}

// Create Resend client
export function createResendClient() {
  const env = validateEmailEnvironment();
  return new Resend(env.RESEND_API_KEY);
}

// Email configuration
export const emailConfig = {
  get fromEmail() {
    return process.env.FROM_EMAIL || 'noreply@empirefootballgroup.com';
  },
  get adminEmail() {
    return process.env.ADMIN_EMAIL || 'admin@empirefootballgroup.com';
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  },
  get supportEmail() {
    return (
      process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'support@empirefootballgroup.com'
    );
  },
};

// Email sending wrapper with error handling
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    const resend = createResendClient();

    const result = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || emailConfig.supportEmail,
    });

    console.log('Email sent successfully:', {
      id: result.data?.id,
      to: typeof options.to === 'string' ? options.to : options.to.join(', '),
      subject: options.subject,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
