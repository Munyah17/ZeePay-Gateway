import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
            </div>
            <div className="flex items-center">
              <Link href="/auth/register" className="text-xs text-gray-600 hover:text-gray-900">
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Sign in to your account</h1>
            <p className="text-xs text-gray-600 mt-2">Enter your email and password to access your dashboard</p>
          </div>

          <form className="space-y-4">
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
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-3 w-3 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-xs text-gray-600 hover:text-gray-900">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded text-xs hover:bg-gray-800"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-gray-900 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
