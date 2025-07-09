'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PaymentCollection, PlayerSignup, SignupStatus } from '@/types/database';
import {
  submitSignup,
  getCollectionForSignup,
  findExistingSignup,
} from '../../actions/signup-actions';

export default function SignupPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<PaymentCollection | null>(null);
  const [existingSignup, setExistingSignup] = useState<PlayerSignup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPhoneLookup, setShowPhoneLookup] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    player_name: '',
    player_phone: '',
    status: 'yes' as SignupStatus,
    notes: '',
  });

  const loadCollection = useCallback(async () => {
    const result = await getCollectionForSignup(slug);

    if (result.error) {
      setError(result.error);
    } else if (result.collection) {
      setCollection(result.collection);
    }

    setIsLoading(false);
  }, [slug]);

  const checkForExistingSignup = useCallback(() => {
    // Check localStorage for existing signup
    const existingSignupId = localStorage.getItem(`signup_${slug}`);
    if (existingSignupId) {
      // We have a stored signup ID, but we'd need to validate it still exists
      // For now, we'll just show the modify option
      setShowPhoneLookup(true);
    }
  }, [slug]);

  useEffect(() => {
    loadCollection();
    checkForExistingSignup();
  }, [loadCollection, checkForExistingSignup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const submitFormData = new FormData();
    submitFormData.append('player_name', formData.player_name);
    submitFormData.append('player_phone', formData.player_phone);
    submitFormData.append('status', formData.status);
    submitFormData.append('notes', formData.notes);

    const result = await submitSignup(slug, submitFormData);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.signup) {
      // Store signup ID in localStorage for future modifications
      localStorage.setItem(`signup_${slug}`, result.signup.id);

      if (result.existingSignup) {
        setSuccess('Your signup has been updated successfully!');
      } else {
        setSuccess('Thank you for signing up! Your response has been recorded.');
      }

      setExistingSignup(result.signup);
    }

    setIsSubmitting(false);
  };

  const handlePhoneLookup = async (phone: string) => {
    setIsLoading(true);
    setError('');

    const result = await findExistingSignup(slug, phone);

    if (result.error) {
      setError(result.error);
    } else if (result.existingSignup) {
      setExistingSignup(result.existingSignup);
      setFormData({
        player_name: result.existingSignup.player_name,
        player_phone: result.existingSignup.player_phone || '',
        status: result.existingSignup.status,
        notes: result.existingSignup.notes || '',
      });
      setShowPhoneLookup(false);
      localStorage.setItem(`signup_${slug}`, result.existingSignup.id);
    }

    setIsLoading(false);
  };

  // Get event details from collection settings
  const eventDate = collection?.settings?.event_date
    ? new Date(collection.settings.event_date as string).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const eventLocation =
    collection?.settings?.location && typeof collection.settings.location === 'string'
      ? collection.settings.location
      : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-6 w-6 animate-spin rounded-full border-b-2"></div>
          <span className="text-text-primary text-base">Loading signup form...</span>
        </div>
      </div>
    );
  }

  if (error && !collection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-text-primary mb-2 text-xl font-bold">Signup Not Available</h1>
          <p className="text-text-secondary text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-penn-red mx-auto mb-4 h-12 w-12">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-text-primary text-2xl font-bold">{collection?.title}</h1>
          {collection?.description && (
            <p className="text-text-secondary mt-2 text-base">{collection.description}</p>
          )}

          {/* Event Details */}
          {(eventDate || eventLocation) && (
            <div className="mt-4 space-y-2">
              {eventDate && (
                <p className="text-text-secondary flex items-center justify-center gap-2 text-sm">
                  <span>📅</span>
                  {eventDate}
                </p>
              )}
              {eventLocation && (
                <p className="text-text-secondary flex items-center justify-center gap-2 text-sm">
                  <span>📍</span>
                  {eventLocation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Phone Lookup Modal */}
        {showPhoneLookup && !existingSignup && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-3 font-medium text-blue-900 dark:text-blue-100">
              Already signed up? Find your response
            </h3>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="flex-1 rounded-md border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.length >= 10) {
                      handlePhoneLookup(input.value);
                    }
                  }
                }}
              />
              <button
                onClick={e => {
                  const input = (e.target as HTMLButtonElement)
                    .previousElementSibling as HTMLInputElement;
                  if (input.value.length >= 10) {
                    handlePhoneLookup(input.value);
                  }
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Find
              </button>
            </div>
            <button
              onClick={() => setShowPhoneLookup(false)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Sign up as new player instead
            </button>
          </div>
        )}

        {/* Signup Form */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm">
          {!showPhoneLookup && !success && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text-primary text-lg font-medium">
                {existingSignup ? 'Update Your Response' : 'Sign Up'}
              </h2>
              {!existingSignup && (
                <button
                  onClick={() => setShowPhoneLookup(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-white"
                >
                  Already signed up?
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Player Name */}
            <div>
              <label
                htmlFor="player_name"
                className="text-text-primary mb-2 block text-sm font-medium"
              >
                Your Name *
              </label>
              <input
                id="player_name"
                type="text"
                required
                value={formData.player_name}
                onChange={e => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="player_phone"
                className="text-text-primary mb-2 block text-sm font-medium"
              >
                Phone Number (optional)
              </label>
              <input
                id="player_phone"
                type="tel"
                value={formData.player_phone}
                onChange={e => setFormData(prev => ({ ...prev, player_phone: e.target.value }))}
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600"
                placeholder="(555) 123-4567"
              />
              <p className="text-text-secondary mt-1 text-xs">
                Helps you find and update your response later
              </p>
            </div>

            {/* Status Selection */}
            <div>
              <label className="text-text-primary mb-3 block text-sm font-medium">
                Will you attend? *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'yes', label: "Yes, I'll be there", color: 'green' },
                  { value: 'maybe', label: 'Maybe / Not sure', color: 'yellow' },
                  { value: 'no', label: "No, I can't make it", color: 'red' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-lg border-2 p-3 transition-all ${
                      formData.status === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, status: e.target.value as SignupStatus }))
                      }
                      className="mr-3 h-4 w-4"
                    />
                    <span className="text-text-primary font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="text-text-primary mb-2 block text-sm font-medium">
                Additional Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600"
                placeholder="Any additional information..."
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.player_name}
              className="bg-penn-red hover:bg-lighter-red w-full rounded-md px-4 py-3 text-base font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {existingSignup ? 'Updating...' : 'Submitting...'}
                </span>
              ) : existingSignup ? (
                'Update Response'
              ) : (
                'Submit Signup'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-text-secondary text-sm">Powered by Empire Football Group</p>
        </div>
      </div>
    </div>
  );
}
