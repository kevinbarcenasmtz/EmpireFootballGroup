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
});

export type CreateCollectionData = z.infer<typeof createCollectionSchema>;

// Function to generate URL-safe slug
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
