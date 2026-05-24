import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthUser {
  userId: number
  username: string
  displayName: string
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (token: string, userId: number, username: string, displayName: string) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'authUser'

function loadFromStorage(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadFromStorage)

  function login(token: string, userId: number, username: string, displayName: string) {
    const authUser: AuthUser = { token, userId, username, displayName }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    setUser(authUser)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: user !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthToken(): string | null {
  const user = loadFromStorage()
  return user?.token ?? null
}
