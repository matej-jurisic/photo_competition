import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Users, Image, Tag, CheckCircle, Lock, Bell, Check, X } from 'lucide-react'
import { api } from '../../api/client'
import AppHeader from '../../components/AppHeader'
import PhotographersTab from '../admin/PhotographersTab'
import TopicsTab from '../admin/TopicsTab'
import JudgesTab from '../admin/JudgesTab'
import type { JoinRequest } from '../../api/types'

type Tab = 'photographers' | 'topics' | 'judges' | 'requests'

function JoinRequestsTab({ contestId }: { contestId: number }) {
  const qc = useQueryClient()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['joinRequests', contestId],
    queryFn: () => api.joinRequests.listForContest(contestId),
  })

  const accept = useMutation({
    mutationFn: (id: number) => api.joinRequests.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['joinRequests', contestId] })
      qc.invalidateQueries({ queryKey: ['judges', contestId] })
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'owned'] })
    },
  })

  const reject = useMutation({
    mutationFn: (id: number) => api.joinRequests.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['joinRequests', contestId] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'owned'] })
    },
  })

  if (isLoading) return <p className="text-gray-400 text-sm">Loading...</p>

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Bell size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">No pending join requests.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r: JoinRequest) => (
        <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">{r.requesterDisplayName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.role === 'Photographer' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {r.role}
              </span>
            </div>
            {r.message && <p className="text-sm text-gray-500 mt-1">{r.message}</p>}
            <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => accept.mutate(r.id)}
              disabled={accept.isPending || reject.isPending}
              className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm hover:bg-green-100 disabled:opacity-50"
            >
              <Check size={13} /> Accept
            </button>
            <button
              onClick={() => reject.mutate(r.id)}
              disabled={accept.isPending || reject.isPending}
              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50"
            >
              <X size={13} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OwnerContestDetailPage() {
  const { id } = useParams()
  const contestId = Number(id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('photographers')
  const qc = useQueryClient()

  const { data: contest, isLoading, error } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => api.contests.get(contestId),
  })

  const { data: requests } = useQuery({
    queryKey: ['joinRequests', contestId],
    queryFn: () => api.joinRequests.listForContest(contestId),
  })

  const setComplete = useMutation({
    mutationFn: (isCompleted: boolean) => api.contests.setComplete(contestId, isCompleted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', id] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'owned'] })
    },
  })

  const setUploadClosed = useMutation({
    mutationFn: (isUploadClosed: boolean) => api.contests.setUploadClosed(contestId, isUploadClosed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', id] })
    },
  })

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex flex-col"><AppHeader /><div className="p-6 text-gray-400">Loading...</div></div>
  if (error || !contest) return <div className="min-h-screen bg-gray-50 flex flex-col"><AppHeader /><div className="p-6 text-red-500">Failed to load contest.</div></div>

  const now = new Date()
  const uploadEnded = now > new Date(contest.uploadEndDate)
  const ratingEnded = now > new Date(contest.ratingEndDate)
  const phase = contest.isCompleted ? 'completed' : ratingEnded ? 'ended' : (uploadEnded || contest.isUploadClosed) ? 'rating' : 'upload'

  const pendingCount = requests?.length ?? 0

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'photographers', label: 'Photographers', icon: <Image size={15} /> },
    { key: 'topics', label: 'Topics', icon: <Tag size={15} /> },
    { key: 'judges', label: 'Judges', icon: <Users size={15} /> },
    { key: 'requests', label: 'Join Requests', icon: <Bell size={15} />, badge: pendingCount },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={16} /> My Contests
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{contest.name}</h1>
              {phase === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>}
              {phase === 'ended' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ended</span>}
              {phase === 'rating' && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Rating open</span>}
              {phase === 'upload' && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Upload open</span>}
            </div>
            {contest.description && <p className="text-sm text-gray-500 mt-1">{contest.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Uploads until {new Date(contest.uploadEndDate).toLocaleDateString('en-GB')} · Ratings until {new Date(contest.ratingEndDate).toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Link to={`/results/${contestId}`} className="text-sm text-indigo-600 hover:underline">View Results</Link>
            {!contest.isCompleted && !uploadEnded && (
              contest.isUploadClosed ? (
                <button
                  onClick={() => setUploadClosed.mutate(false)}
                  disabled={setUploadClosed.isPending}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Reopen Uploads
                </button>
              ) : (
                <button
                  onClick={() => { if (confirm('Close uploads early?')) setUploadClosed.mutate(true) }}
                  disabled={setUploadClosed.isPending}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <Lock size={14} /> Close Uploads
                </button>
              )
            )}
            {contest.isCompleted ? (
              <button
                onClick={() => { if (confirm('Reopen this contest?')) setComplete.mutate(false) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Reopen
              </button>
            ) : (
              <button
                onClick={() => { if (confirm('Mark as completed? Results become public and ratings lock.')) setComplete.mutate(true) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCircle size={14} /> Complete
              </button>
            )}
            <Link
              to={`/my-contests/${id}/edit`}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </Link>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.icon} {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="bg-amber-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'photographers' && <PhotographersTab contestId={contestId} contest={contest} />}
        {tab === 'topics' && <TopicsTab contestId={contestId} />}
        {tab === 'judges' && <JudgesTab contestId={contestId} />}
        {tab === 'requests' && <JoinRequestsTab contestId={contestId} />}
      </main>
    </div>
  )
}
