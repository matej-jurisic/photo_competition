import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Users, Image, Clock, CheckCircle, X } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import AppHeader from '../../components/AppHeader'
import type { ContestPublic, JoinRole } from '../../api/types'

function ContestStatusBadge({ c }: { c: ContestPublic }) {
  const now = new Date()
  if (c.isCompleted) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={11} /> Completed</span>
  if (now > new Date(c.ratingEndDate)) return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ended</span>
  if (now > new Date(c.uploadEndDate) || c.isUploadClosed) return <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Rating open</span>
  return <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Upload open</span>
}

interface JoinModalProps {
  contest: ContestPublic
  availableRoles: JoinRole[]
  onClose: () => void
}

function JoinModal({ contest, availableRoles, onClose }: JoinModalProps) {
  const [role, setRole] = useState<JoinRole>(availableRoles[0])
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => api.joinRequests.create(contest.id, { role, message: message.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['joinRequests', 'my'] })
      setDone(true)
    },
  })

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
          <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Request sent!</h2>
          <p className="text-sm text-gray-500 mb-4">The contest owner will review your request.</p>
          <button onClick={onClose} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 w-full">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Join "{contest.name}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-500 mb-3">
            {(mutation.error as { response?: { data?: string } })?.response?.data ?? 'Failed to send request.'}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Request to join as</span>
            <div className="flex gap-2 mt-1">
              {availableRoles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    role === r
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Message (optional)</span>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
              placeholder="Introduce yourself to the contest owner..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </label>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 w-full"
          >
            {mutation.isPending ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContestBrowserPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [joiningContest, setJoiningContest] = useState<ContestPublic | null>(null)

  const { data: contests, isLoading } = useQuery({
    queryKey: ['browse', 'contests'],
    queryFn: api.browse.listContests,
  })

  const { data: myContests } = useQuery({
    queryKey: ['dashboard', 'joined'],
    queryFn: api.dashboard.myContests,
    enabled: isLoggedIn,
  })

  const { data: myRequests } = useQuery({
    queryKey: ['joinRequests', 'my'],
    queryFn: api.joinRequests.myRequests,
    enabled: isLoggedIn,
  })

  const allRoles: JoinRole[] = ['Photographer', 'Judge']

  const joinedRoles = new Map<number, Set<JoinRole>>()
  myContests?.forEach(e => {
    if (!joinedRoles.has(e.contest.id)) joinedRoles.set(e.contest.id, new Set())
    joinedRoles.get(e.contest.id)!.add(e.role)
  })

  const pendingRoles = new Map<number, Set<JoinRole>>()
  myRequests?.filter(r => r.status === 'Pending').forEach(r => {
    if (!pendingRoles.has(r.contestId)) pendingRoles.set(r.contestId, new Set())
    pendingRoles.get(r.contestId)!.add(r.role)
  })

  function availableRolesFor(contestId: number): JoinRole[] {
    const joined = joinedRoles.get(contestId) ?? new Set()
    const pending = pendingRoles.get(contestId) ?? new Set()
    return allRoles.filter(r => !joined.has(r) && !pending.has(r))
  }

  function handleJoinClick(c: ContestPublic) {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setJoiningContest(c)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Photo Contests</h1>
        </div>

        {isLoading && <p className="text-gray-500">Loading contests...</p>}

        {contests && contests.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Camera size={48} className="mx-auto mb-3 opacity-40" />
            <p>No contests yet. Be the first to create one!</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contests?.map(c => {
            const myRoles = allRoles.filter(r => joinedRoles.get(c.id)?.has(r))
            const pendingForContest = allRoles.filter(r => pendingRoles.get(c.id)?.has(r))
            return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900 leading-snug">{c.name}</h2>
                <ContestStatusBadge c={c} />
              </div>

              {c.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{c.description}</p>
              )}

              {c.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.topics.map(t => (
                    <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.name}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Image size={12} /> {c.photographerCount} photographers</span>
                <span className="flex items-center gap-1"><Users size={12} /> {c.judgeCount} judges</span>
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                Uploads until {new Date(c.uploadEndDate).toLocaleDateString('en-GB')}
              </div>

              {c.ownerDisplayName && (
                <p className="text-xs text-gray-400">by {c.ownerDisplayName}</p>
              )}

              {(myRoles.length > 0 || pendingForContest.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {myRoles.map(r => (
                    <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r === 'Photographer' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                      {r}
                    </span>
                  ))}
                  {pendingForContest.map(r => (
                    <span key={`pending-${r}`} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {r} (pending)
                    </span>
                  ))}
                </div>
              )}

              {!c.isCompleted && new Date() < new Date(c.ratingEndDate) && availableRolesFor(c.id).length > 0 && (
                <button
                  onClick={() => handleJoinClick(c)}
                  className="mt-auto bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 w-full"
                >
                  Request to join
                </button>
              )}
            </div>
            )
          })}
        </div>
      </main>

      {joiningContest && (
        <JoinModal
          contest={joiningContest}
          availableRoles={availableRolesFor(joiningContest.id)}
          onClose={() => setJoiningContest(null)}
        />
      )}
    </div>
  )
}
