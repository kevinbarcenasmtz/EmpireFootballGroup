// Updated database types for signup collections feature

export interface PaymentCollection {
  id: string;
  created_at: string;
  updated_at: string;
  admin_id: string;
  title: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  slug: string;
  is_active: boolean;
  settings?: Record<string, never>;
  collection_type?: 'payment' | 'signup';
}

// NEW: Player signup interface
export interface PlayerSignup {
  id: string;
  created_at: string;
  updated_at: string;
  collection_id: string;
  player_name: string;
  player_phone?: string;
  status: 'yes' | 'no' | 'maybe';
  notes?: string;
  metadata?: Record<string, unknown>;
}

// NEW: Signup summary type for counts
export interface SignupSummary {
  yes: number;
  no: number;
  maybe: number;
  total: number;
}

// Existing payment interface (unchanged)
export interface Payment {
  id: string;
  created_at: string;
  collection_id: string;
  square_payment_id?: string;
  amount: number;
  currency: string;
  payer_email?: string;
  payer_name?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, never>;
}

// Updated database schema type
export interface Database {
  public: {
    Tables: {
      payment_collections: {
        Row: PaymentCollection;
        Insert: Omit<PaymentCollection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentCollection, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
      // NEW: Player signups table
      player_signups: {
        Row: PlayerSignup;
        Insert: Omit<PlayerSignup, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PlayerSignup, 'id' | 'created_at'>>;
      };
    };
    Views: {
      // NEW: Admin summary view
      admin_collection_summary: {
        Row: PaymentCollection & {
          signup_count?: number;
          signup_summary?: SignupSummary;
        };
      };
    };
    Functions: {
      // NEW: Utility functions
      get_signup_count: {
        Args: { collection_uuid: string };
        Returns: number;
      };
      get_signup_summary: {
        Args: { collection_uuid: string };
        Returns: SignupSummary;
      };
    };
  };
}

// NEW: Helper types for forms and components
export type CollectionType = 'payment' | 'signup';
export type SignupStatus = 'yes' | 'no' | 'maybe';

// NEW: Form data types
export interface CreateCollectionFormData {
  title: string;
  description?: string;
  target_amount?: number;
  collection_type: CollectionType;
  // For signup collections
  event_date?: string;
  location?: string;
}

export interface SubmitSignupFormData {
  player_name: string;
  player_phone?: string;
  status: SignupStatus;
  notes?: string;
}

// NEW: Component prop types
export interface CollectionCardProps {
  collection: PaymentCollection;
  userId: string;
}

export interface SignupFormProps {
  collection: PaymentCollection;
  existingSignup?: PlayerSignup;
  onSubmit: (data: SubmitSignupFormData) => Promise<void>;
}

// NEW: Hook return types
export interface UseRealtimeSignupsReturn {
  signups: PlayerSignup[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  summary: SignupSummary;
}

export interface UseSignupModificationReturn {
  existingSignup: PlayerSignup | null;
  canModify: boolean;
  isLoading: boolean;
  submitSignup: (data: SubmitSignupFormData) => Promise<{ success: boolean; error?: string }>;
  updateSignup: (data: SubmitSignupFormData) => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// TYPE GUARD FUNCTIONS - ADD THESE HERE
// ============================================

// Type guards for runtime validation
export function isValidSignupStatus(status: string): status is SignupStatus {
  return ['yes', 'no', 'maybe'].includes(status);
}

export function isValidCollectionType(type: string): type is CollectionType {
  return ['payment', 'signup'].includes(type);
}

export function isSignupCollection(collection: PaymentCollection): boolean {
  return collection.collection_type === 'signup';
}

export function isPaymentCollection(collection: PaymentCollection): boolean {
  return collection.collection_type === 'payment' || !collection.collection_type;
}

// Helper to get collection display info
export function getCollectionTypeInfo(collection: PaymentCollection) {
  if (isSignupCollection(collection)) {
    return {
      type: 'signup' as const,
      icon: '📝',
      primaryMetric: 'signups',
      actionText: 'Sign Up',
    };
  }

  return {
    type: 'payment' as const,
    icon: '💰',
    primaryMetric: 'amount',
    actionText: 'Pay Now',
  };
}
