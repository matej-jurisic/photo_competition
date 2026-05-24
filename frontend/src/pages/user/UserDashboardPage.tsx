import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import AppHeader from '../../components/AppHeader'

function contestPhaseLabel(c: { isCompleted: boolean; ratingEndDate: string; uploadEndDate: string; isUploadClosed: boolean }) {
  const now = new Date()
  if (c.isCompleted) return { label: 'Completed', cls: 'bg-green-100 text-green-700' }
  if (now > new Date(c.ratingEndDate)) return { label: 'Ended', cls: 'bg-gray-100 text-gray-500' }
  if (now > new Date(c.uploadEndDate) || c.isUploadClosed) return { label: 'Rating open', cls: 'bg-blue-50 text-blue-700' }
  return { label: 'Upload open', cls: 'bg-indigo-50 text-indigo-700' }
}

export default function UserDashboardPage() {
  const { user } = useAuth()

  const { data: joined, isLoading: joinedLoading } = useQuery({
    queryKey: ['dashboard', 'joined'],
    queryFn: api.dashboard.myContests,
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Contests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.displayName}</p>
        </div>

        {joinedLoading && <p className="text-gray-400 text-sm">Loading...</p>}
        {joined && joined.length === 0 && (
          <p className="text-sm text-gray-400">
            You haven't joined any contests yet.{' '}
            <Link to="/contests" className="text-indigo-600 hover:underline">Browse contests</Link>
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {joined?.map(({ contest: c, role }) => {
            const phase = contestPhaseLabel(c)
            const href = role === 'Photographer'
              ? `/my-sessions/photographer/${c.id}`
              : `/my-sessions/judge/${c.id}`
            return (
              <Link
                key={`${c.id}-${role}`}
                to={href}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${phase.cls}`}>{phase.label}</span>
                </div>
                <span className="text-xs text-gray-400">Role: {role}</span>
                <div className="flex items-center gap-1 text-xs text-indigo-600 mt-auto">
                  Open <ArrowRight size={12} />
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
