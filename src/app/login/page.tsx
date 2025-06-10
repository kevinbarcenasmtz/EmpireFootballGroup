'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from './action'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/admin')
          return
        }
      } catch (error) {
        console.log('Auth check failed:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  // Load remembered email on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem('rememberedEmail')
      if (rememberedEmail) {
        setEmail(rememberedEmail)
        setRememberMe(true)
      }
    }
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    
    const emailValue = formData.get('email') as string
    
    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', emailValue)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    
    const result = await login(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // If successful, the action will redirect
  }

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-penn-red"></div>
          <span className="text-text-primary">Checking authentication...</span>
        </div>
      </div>
    )
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
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-background text-text-primary border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="text-text-primary block text-sm font-medium">
              Password:
            </label>
            <div className="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"}
                required 
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.form) {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget.form)
                    handleSubmit(formData)
                  }
                }}
                className="bg-background text-text-primary border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-sm disabled:opacity-50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 text-penn-red focus:ring-penn-red border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary">
              Remember my email
            </label>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-penn-red hover:bg-lighter-red w-full rounded-md px-4 py-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
          
          {error && (
            <p className="text-red-600 text-center text-sm mt-2">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}