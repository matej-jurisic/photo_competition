import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import AppHeader from '../../components/AppHeader'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.auth.login({ username: username.trim(), password }),
    onSuccess: result => {
      login(result.token, result.userId, result.username, result.displayName)
      navigate('/dashboard')
    },
    onError: () => setError('Invalid username or password.'),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Username and password are required.')
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
            <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-4">
            No account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
