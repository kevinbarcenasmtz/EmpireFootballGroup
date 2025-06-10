'use client'

import { useState } from 'react'
import { login } from './action'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    
    const result = await login(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // If successful, the action will redirect, so we don't need to setIsLoading(false)
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="bg-contrast w-full max-w-md rounded-lg border border-gray-200 p-8 shadow-lg dark:border-gray-700">
        <h1 className="text-text-primary mb-6 text-center text-2xl font-bold">
          Empire Football Group Admin
        </h1>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-text-primary block text-sm font-medium">
              Email:
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              disabled={isLoading}
              className="bg-background text-text-primary border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-text-primary block text-sm font-medium">
              Password:
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              disabled={isLoading}
              className="bg-background text-text-primary border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-penn-red hover:bg-lighter-red w-full rounded-md px-4 py-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
          {error && (
            <p className="text-red-600 text-center text-sm">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}