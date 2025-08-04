'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createCollectionSchema, generateSlug } from '@/lib/validations/collections';
import { PaymentCollection, PlayerSignup, Payment } from '@/types/database';

interface ActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  collection?: T;
  signups?: T;
  payments?: T;
}

// UPDATED: Enhanced createCollection to handle signup collections
export async function createCollection(
  formData: FormData
): Promise<ActionResult<PaymentCollection>> {
  try {
    // Get user info from middleware headers (token validation already done)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    console.log('Creating collection for user:', userEmail);

    // Validate form data - UPDATED to include collection_type
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      target_amount: formData.get('target_amount') as string,
      collection_type: formData.get('collection_type') as string,
      event_date: formData.get('event_date') as string,
      location: formData.get('location') as string,
    };

    const validatedData = createCollectionSchema.parse(rawData);

    // Generate unique slug
    const slug = generateSlug(validatedData.title);

    // Prepare metadata for signup collections
    const metadata: Record<string, unknown> = {};
    if (validatedData.collection_type === 'signup') {
      if (validatedData.event_date) metadata.event_date = validatedData.event_date;
      if (validatedData.location) metadata.location = validatedData.location;
    }

    // Use server client for database operations
    const supabase = await createClient();

    // Insert into database - UPDATED to include collection_type
    const { data, error } = await supabase
      .from('payment_collections')
      .insert({
        admin_id: userId,
        title: validatedData.title,
        description: validatedData.description || null,
        target_amount:
          validatedData.collection_type === 'signup' ? null : validatedData.target_amount || null,
        collection_type: validatedData.collection_type,
        slug: slug,
        is_active: true,
        settings: Object.keys(metadata).length > 0 ? metadata : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to create collection. Please try again.' };
    }

    revalidatePath('/admin/collections');
    return { success: true, collection: data };
  } catch (error) {
    console.error('Create collection error:', error);
    return { error: 'Failed to create collection. Please check your input.' };
  }
}

// NEW: Get signups for a specific collection (admin only)
export async function getSignups(collectionId: string): Promise<ActionResult<PlayerSignup[]>> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Verify user owns this collection and get signups
    const { data, error } = await supabase
      .from('player_signups')
      .select(
        `
        *,
        payment_collections!inner(admin_id)
      `
      )
      .eq('collection_id', collectionId)
      .eq('payment_collections.admin_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get signups error:', error);
      return { error: 'Failed to fetch signups' };
    }

    // Extract just the signup data (remove the joined collection data)
    const signups = data.map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { payment_collections, ...signup } = item;
      return signup as PlayerSignup;
    });

    return { success: true, signups: signups };
  } catch (error) {
    console.error('Get signups error:', error);
    return { error: 'Failed to fetch signups' };
  }
}

// NEW: Delete a signup (admin only)
export async function deleteSignup(signupId: string): Promise<ActionResult> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    const supabase = await createClient();

    // First verify the signup belongs to a collection owned by this user
    const { data: signupData, error: verifyError } = await supabase
      .from('player_signups')
      .select(
        `
        id,
        payment_collections!inner(admin_id)
      `
      )
      .eq('id', signupId)
      .eq('payment_collections.admin_id', userId)
      .single();

    if (verifyError || !signupData) {
      return { error: 'Signup not found or access denied' };
    }

    // Delete the signup
    const { error } = await supabase.from('player_signups').delete().eq('id', signupId);

    if (error) {
      console.error('Delete signup error:', error);
      return { error: 'Failed to delete signup' };
    }

    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Delete signup error:', error);
    return { error: 'Failed to delete signup' };
  }
}

// Existing actions (unchanged)
export async function toggleCollectionStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    // Get user info from middleware headers
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Ensure user can only modify their own collections
    const { error } = await supabase
      .from('payment_collections')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('admin_id', userId); // Security: only update user's own collections

    if (error) {
      console.error('Toggle collection status error:', error);
      return { error: 'Failed to update collection status' };
    }

    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Toggle collection status error:', error);
    return { error: 'Failed to update collection status' };
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  try {
    // Get user info from middleware headers
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Ensure user can only delete their own collections
    const { error } = await supabase
      .from('payment_collections')
      .delete()
      .eq('id', id)
      .eq('admin_id', userId); // Security: only delete user's own collections

    if (error) {
      console.error('Delete collection error:', error);
      return { error: 'Failed to delete collection' };
    }

    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Delete collection error:', error);
    return { error: 'Failed to delete collection' };
  }
}

// Get payments for a specific collection (admin only)
export async function getPayments(collectionId: string): Promise<ActionResult<Payment[]>> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return { error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Verify user owns this collection and get completed payments
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        payment_collections!inner(admin_id)
      `
      )
      .eq('collection_id', collectionId)
      .eq('payment_collections.admin_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get payments error:', error);
      return { error: 'Failed to fetch payments' };
    }

    // Extract just the payment data (remove the joined collection data)
    const payments = data.map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { payment_collections, ...payment } = item;
      return payment as Payment;
    });

    return { success: true, payments: payments };
  } catch (error) {
    console.error('Get payments error:', error);
    return { error: 'Failed to fetch payments' };
  }
}
