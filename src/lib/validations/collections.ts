import { z } from 'zod';

export const createCollectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  target_amount: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    })
    .refine(val => val === undefined || val > 0, {
      message: 'Target amount must be greater than 0',
    }),
  // NEW: Collection type validation
  collection_type: z.enum(['payment', 'signup']).default('payment'),
  // FIXED: Event details - handle null values
  event_date: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null || val === '') ? undefined : val),
  location: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null || val === '') ? undefined : val),
});

// Signup submission validation
export const submitSignupSchema = z.object({
  player_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  player_phone: z
    .string()
    .optional()
    .refine(val => !val || val.length >= 10, {
      message: 'Phone number must be at least 10 digits',
    }),
  status: z.enum(['yes', 'no', 'maybe']),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type CreateCollectionData = z.infer<typeof createCollectionSchema>;
export type SubmitSignupData = z.infer<typeof submitSignupSchema>;

// Function to generate URL-safe slug (existing - unchanged)
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 50) + // Limit length
    '-' +
    Math.random().toString(36).substring(2, 8)
  ); // Add random suffix
}
