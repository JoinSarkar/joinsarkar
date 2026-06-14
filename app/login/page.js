'use client'

import Link from 'next/link'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    if (loading) return
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  async function handleKeyDown(e) {
    if (e.key === 'Enter') {
      await handleLogin()
    }
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-saffron font-bold text-2xl">JOIN</span>
            <span className="text-white font-bold text-2xl"> SARKAR</span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Welcome back</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="rahul@example.com"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your password"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <p className="text-white/40 text-sm text-center mt-6">
            Do not have an account?{' '}
            <Link href="/signup" className="text-saffron hover:underline">
              Sign up free
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}