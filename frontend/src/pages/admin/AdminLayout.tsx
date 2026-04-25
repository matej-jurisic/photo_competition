import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { getAdminKey, setAdminKey } from '../../api/client'

export default function AdminLayout() {
  const [key, setKey] = useState(getAdminKey())
  const [input, setInput] = useState('')
  const [prompted, setPrompted] = useState(false)

  useEffect(() => {
    if (!key && !prompted) {
      setPrompted(true)
    }
  }, [key, prompted])

  if (!key && prompted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="text-indigo-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">Photo Rating Admin</h1>
          </div>
          <p className="text-sm text-gray-600 mb-4">Enter the admin key to continue.</p>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Admin key"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  function handleSubmit() {
    if (!input.trim()) return
    setAdminKey(input.trim())
    setKey(input.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Camera className="text-indigo-600" size={22} />
        <span className="font-bold text-gray-900 text-lg">Photo Rating</span>
        <nav className="flex gap-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            Contests
          </NavLink>
        </nav>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
