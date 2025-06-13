// Re-export everything from resend-client for cleaner imports
export {
    createResendClient,
    emailConfig,
    sendEmail,
    canSendEmail,
    getEmailConfigStatus
  } from './resend-client';
  
  export type {
    EmailOptions,
    EmailResult,
    EmailConfigStatus
  } from './types';