import { login, signup } from "./action"

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="bg-contrast w-full max-w-md rounded-lg border border-gray-200 p-8 shadow-lg dark:border-gray-700">
        <h1 className="text-text-primary mb-6 text-center text-2xl font-bold">
          Empire Football Group Admin
        </h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="text-text-primary block text-sm font-medium">
              Email:
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="bg-background border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red"
            />
          </div>
          <div>
            <label htmlFor="password" className="bg-contrast text-text-primary block text-sm font-medium">
              Password:
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="bg-contast border-text-secondary mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red"
            />
          </div>
          <div className="flex gap-4">
            <button 
              formAction={login}
              className="bg-penn-red hover:bg-lighter-red flex-1 rounded-md px-4 py-2 text-white transition-colors"
            >
              Log in
            </button>
            <button 
              formAction={signup}
              className="border-penn-red text-penn-red hover:bg-penn-red flex-1 rounded-md border px-4 py-2 transition-colors hover:text-white"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}