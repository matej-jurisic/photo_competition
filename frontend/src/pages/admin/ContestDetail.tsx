import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Users, Image, Tag, CheckCircle, Lock, Bell, Check, X, MoreVertical } from 'lucide-react'
import { api } from '../../api/client'
import PhotographersTab from './PhotographersTab'
import TopicsTab from './TopicsTab'
import JudgesTab from './JudgesTab'
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
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['judges', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
    },
  })

  const reject = useMutation({
    mutationFn: (id: number) => api.joinRequests.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['joinRequests', contestId] }),
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

function ActionsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-40 flex flex-col">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ContestDetail() {
  const { id } = useParams()
  const contestId = Number(id)
  const [tab, setTab] = useState<Tab>('photographers')
  const qc = useQueryClient()

  const { data: contest, isLoading, error } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => api.contests.get(contestId),
  })

  const setComplete = useMutation({
    mutationFn: (isCompleted: boolean) => api.contests.setComplete(contestId, isCompleted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', id] })
      qc.invalidateQueries({ queryKey: ['contests'] })
    },
  })

  const setUploadClosed = useMutation({
    mutationFn: (isUploadClosed: boolean) => api.contests.setUploadClosed(contestId, isUploadClosed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', id] })
      qc.invalidateQueries({ queryKey: ['contests'] })
    },
  })

  const { data: joinRequests } = useQuery({
    queryKey: ['joinRequests', contestId],
    queryFn: () => api.joinRequests.listForContest(contestId),
  })
  const pendingCount = joinRequests?.length ?? 0

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (error || !contest) return <p className="text-red-500">Failed to load contest.</p>

  const now = new Date()
  const uploadEnded = now > new Date(contest.uploadEndDate)
  const ratingEnded = now > new Date(contest.ratingEndDate)
  const phase = contest.isCompleted ? 'completed' : ratingEnded ? 'ended' : (uploadEnded || contest.isUploadClosed) ? 'rating' : 'upload'

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'photographers', label: 'Photographers', icon: <Image size={15} /> },
    { key: 'topics', label: 'Topics', icon: <Tag size={15} /> },
    { key: 'judges', label: 'Judges', icon: <Users size={15} /> },
    { key: 'requests', label: 'Join Requests', icon: <Bell size={15} />, badge: pendingCount },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Contests
        </Link>
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
          {contest.rewards.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {contest.rewards.map((r, i) => (
                <span key={i} className="text-sm text-indigo-600">{r}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Uploads until {new Date(contest.uploadEndDate).toLocaleDateString('en-GB')} · Ratings until {new Date(contest.ratingEndDate).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
          <Link
            to={`/results/${contestId}`}
            className="sm:hidden text-sm text-indigo-600 hover:underline"
          >
            View Results
          </Link>
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <Link
              to={`/results/${contestId}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              View Results
            </Link>
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
                  onClick={() => { if (confirm('Close uploads early? Photographers will no longer be able to upload, and judging will open immediately.')) setUploadClosed.mutate(true) }}
                  disabled={setUploadClosed.isPending}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <Lock size={14} /> Close Uploads
                </button>
              )
            )}
            {contest.isCompleted ? (
              <button
                onClick={() => { if (confirm('Reopen this contest for further ratings?')) setComplete.mutate(false) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Reopen
              </button>
            ) : (
              <button
                onClick={() => { if (confirm('Mark this contest as completed? Results will become public and ratings will be locked.')) setComplete.mutate(true) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCircle size={14} /> Complete
              </button>
            )}
            <Link
              to={`/admin/contests/${id}/edit`}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </Link>
          </div>

          {/* Mobile dropdown */}
          <ActionsMenu>
            {!contest.isCompleted && !uploadEnded && (
              contest.isUploadClosed ? (
                <button
                  onClick={() => setUploadClosed.mutate(false)}
                  disabled={setUploadClosed.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reopen Uploads
                </button>
              ) : (
                <button
                  onClick={() => { if (confirm('Close uploads early? Photographers will no longer be able to upload, and judging will open immediately.')) setUploadClosed.mutate(true) }}
                  disabled={setUploadClosed.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Lock size={14} /> Close Uploads
                </button>
              )
            )}
            {contest.isCompleted ? (
              <button
                onClick={() => { if (confirm('Reopen this contest for further ratings?')) setComplete.mutate(false) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Reopen
              </button>
            ) : (
              <button
                onClick={() => { if (confirm('Mark this contest as completed? Results will become public and ratings will be locked.')) setComplete.mutate(true) }}
                disabled={setComplete.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCircle size={14} /> Complete
              </button>
            )}
            <Link
              to={`/admin/contests/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </Link>
          </ActionsMenu>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            title={t.label}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
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
    </div>
  )
}
