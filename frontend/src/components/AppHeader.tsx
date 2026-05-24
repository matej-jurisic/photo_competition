import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Camera, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AppHeader() {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/contests')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4">
      <Link to="/contests" className="flex items-center gap-2 mr-1 sm:mr-2 flex-shrink-0">
        <Camera className="text-indigo-600" size={22} />
        <span className="hidden sm:inline font-bold text-gray-900 text-lg">Photo Rating</span>
      </Link>
      <nav className="flex gap-1 flex-1">
        <NavLink
          to="/contests"
          className={({ isActive }) =>
            `px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          Browse
        </NavLink>
        {isLoggedIn && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            My contests
          </NavLink>
        )}
        {!isLoggedIn && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isLoggedIn ? (
          <>
            <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[120px]">{user!.displayName}</span>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Login</Link>
            <Link to="/register" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700">Register</Link>
          </>
        )}
      </div>
    </header>
  )
}
