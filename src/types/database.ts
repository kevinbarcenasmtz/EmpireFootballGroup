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
}

export interface Payment {
  id: string;
  created_at: string;
  collection_id: string;
  square_payment_id?: string; // This should be optional since it's nullable in your schema
  amount: number;
  currency: string;
  payer_email?: string;
  payer_name?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, never>;
}

export interface Database {
  public: {
    Tables: {
      payment_collections: {
        Row: PaymentCollection;
        Insert: Omit<PaymentCollection, 'id' | 'created_at' | 'updated_at'>; // Remove current_amount from omit since it has a default
        Update: Partial<Omit<PaymentCollection, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
    };
  };
}
