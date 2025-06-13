export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }
  
  export interface EmailResult {
    success: boolean;
    id?: string;
    message?: string;
    error?: string;
  }
  
  export interface EmailConfigStatus {
    available: boolean;
    fromEmail?: string;
    adminEmail?: string;
    appUrl?: string;
    supportEmail?: string;
    message?: string;
  }