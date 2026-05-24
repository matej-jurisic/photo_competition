import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import AppHeader from '../../components/AppHeader'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.auth.register({ username: username.trim(), displayName: displayName.trim(), password }),
    onSuccess: result => {
      login(result.token, result.userId, result.username, result.displayName)
      navigate('/dashboard')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: string } })?.response?.data
      setError(typeof msg === 'string' ? msg : 'Registration failed. Username may already be taken.')
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !displayName.trim() || !password) {
      setError('All fields are required.')
      return
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="text-indigo-600" size={22} />
            <h1 className="text-xl font-bold text-gray-900">Create account</h1>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <p className="text-xs text-gray-400 mt-0.5">Used to sign in. 3–30 characters, lowercase.</p>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Display name</span>
              <p className="text-xs text-gray-400 mt-0.5">Your name shown to others.</p>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Confirm password</span>
              <input
                type="password"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
