'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createCollectionSchema, generateSlug } from '@/lib/validations/collections'

export async function createCollection(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'You must be logged in to create a collection' }
    }

    // Validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      target_amount: formData.get('target_amount') as string,
    }

    const validatedData = createCollectionSchema.parse(rawData)
    
    // Generate unique slug
    const slug = generateSlug(validatedData.title)
    
    // Insert into database
    const { data, error } = await supabase
      .from('payment_collections')
      .insert({
        admin_id: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        target_amount: validatedData.target_amount || null,
        slug: slug,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: 'Failed to create collection. Please try again.' }
    }

    revalidatePath('/admin/collections')
    return { success: true, collection: data }
    
  } catch (error) {
    console.error('Create collection error:', error)
    return { error: 'Failed to create collection. Please check your input.' }
  }
}

export async function toggleCollectionStatus(id: string, isActive: boolean) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('payment_collections')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      return { error: 'Failed to update collection status' }
    }

    revalidatePath('/admin/collections')
    return { success: true }
    
  } catch (error) {
    return { error: 'Failed to update collection status' }
  }
}

export async function deleteCollection(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('payment_collections')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: 'Failed to delete collection' }
    }

    revalidatePath('/admin/collections')
    return { success: true }
    
  } catch (error) {
    return { error: 'Failed to delete collection' }
  }
}