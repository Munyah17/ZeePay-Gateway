import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
            </div>
            <div className="flex items-center">
              <Link href="/auth/login" className="text-xs text-gray-600 hover:text-gray-900">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
            <p className="text-xs text-gray-600 mt-2">Start accepting payments in minutes</p>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="business-name" className="block text-xs font-medium text-gray-700 mb-1">
                Business name
              </label>
              <input
                id="business-name"
                name="business-name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-3 w-3 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-gray-900 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gray-900 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded text-xs hover:bg-gray-800"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gray-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
