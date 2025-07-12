'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service'; 
import { submitSignupSchema } from '@/lib/validations/collections';
import { PlayerSignup } from '@/types/database';
interface SignupActionResult {
  success?: boolean;
  error?: string;
  signup?: PlayerSignup;
  existingSignup?: PlayerSignup;
}

// Submit new signup or update existing one
export async function submitSignup(
  collectionSlug: string,
  formData: FormData
): Promise<SignupActionResult> {
  try {
    // Validate input data
    const rawData = {
      player_name: formData.get('player_name') as string,
      player_phone: formData.get('player_phone') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string,
    };

    const validatedData = submitSignupSchema.parse(rawData);

    // Create regular client for reading collection (public access)
    const supabase = await createClient();
    
    // Create service client for database writes (bypasses RLS)
    const serviceSupabase = createServiceClient();

    // Get collection by slug using regular client (public read access)
    const { data: collection, error: collectionError } = await supabase
      .from('payment_collections')
      .select('id, title, is_active, collection_type')
      .eq('slug', collectionSlug)
      .eq('is_active', true)
      .single();

    if (collectionError || !collection) {
      return { error: 'Collection not found or inactive' };
    }

    if (collection.collection_type !== 'signup') {
      return { error: 'This is not a signup collection' };
    }

    // Check for existing signup by name and phone using SERVICE CLIENT
    const { data: existingSignups, error: checkError } = await serviceSupabase
      .from('player_signups')
      .select('*')
      .eq('collection_id', collection.id)
      .eq('player_name', validatedData.player_name)
      .eq('player_phone', validatedData.player_phone || null);

    if (checkError) {
      console.error('Check existing signup error:', checkError);
      return { error: 'Failed to check existing signup' };
    }

    // If existing signup found, update it using SERVICE CLIENT
    if (existingSignups && existingSignups.length > 0) {
      const existingSignup = existingSignups[0];

      const { data: updatedSignup, error: updateError } = await serviceSupabase
        .from('player_signups')
        .update({
          status: validatedData.status,
          notes: validatedData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSignup.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update signup error:', updateError);
        return { error: 'Failed to update signup' };
      }

      revalidatePath(`/signup/${collectionSlug}`);
      return { success: true, signup: updatedSignup, existingSignup: existingSignup };
    }

    // Create new signup using SERVICE CLIENT
    const { data: newSignup, error: insertError } = await serviceSupabase
      .from('player_signups')
      .insert({
        collection_id: collection.id,
        player_name: validatedData.player_name,
        player_phone: validatedData.player_phone || null,
        status: validatedData.status,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert signup error:', insertError);

      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return { error: 'You have already signed up for this event' };
      }

      return { error: 'Failed to submit signup' };
    }

    revalidatePath(`/signup/${collectionSlug}`);
    return { success: true, signup: newSignup };
  } catch (error) {
    console.error('Submit signup error:', error);
    return { error: 'Failed to submit signup. Please check your input.' };
  }
}

// Find existing signup by phone number (for modification)
export async function findExistingSignup(
  collectionSlug: string,
  playerPhone: string
): Promise<SignupActionResult> {
  try {
    if (!playerPhone || playerPhone.length < 10) {
      return { error: 'Please provide a valid phone number' };
    }

    const supabase = await createClient();

    // Get collection first
    const { data: collection, error: collectionError } = await supabase
      .from('payment_collections')
      .select('id')
      .eq('slug', collectionSlug)
      .eq('is_active', true)
      .single();

    if (collectionError || !collection) {
      return { error: 'Collection not found' };
    }

    // Find signup by phone number
    const { data: signup, error: signupError } = await supabase
      .from('player_signups')
      .select('*')
      .eq('collection_id', collection.id)
      .eq('player_phone', playerPhone)
      .single();

    if (signupError) {
      if (signupError.code === 'PGRST116') {
        return { error: 'No signup found with that phone number' };
      }
      return { error: 'Failed to find signup' };
    }

    return { success: true, existingSignup: signup };
  } catch (error) {
    console.error('Find existing signup error:', error);
    return { error: 'Failed to find existing signup' };
  }
}

// Get collection info for public signup page
export async function getCollectionForSignup(slug: string) {
  try {
    const supabase = await createClient();

    const { data: collection, error } = await supabase
      .from('payment_collections')
      .select(
        'id, title, description, is_active, collection_type, settings, created_at, updated_at, admin_id, slug, current_amount'
      )
      .eq('slug', slug)
      .single();

    if (error || !collection) {
      return { error: 'Collection not found' };
    }

    if (!collection.is_active) {
      return { error: 'This collection is no longer active' };
    }

    if (collection.collection_type !== 'signup') {
      return { error: 'This is not a signup collection' };
    }

    return { success: true, collection };
  } catch (error) {
    console.error('Get collection for signup error:', error);
    return { error: 'Failed to load collection' };
  }
}
