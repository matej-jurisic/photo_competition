import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Users, Image, Tag, CheckCircle } from 'lucide-react'
import { api } from '../../api/client'
import PhotographersTab from './PhotographersTab'
import TopicsTab from './TopicsTab'
import JudgesTab from './JudgesTab'

type Tab = 'photographers' | 'topics' | 'judges'

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

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (error || !contest) return <p className="text-red-500">Failed to load contest.</p>

  const now = new Date()
  const uploadEnded = now > new Date(contest.uploadEndDate)
  const ratingEnded = now > new Date(contest.ratingEndDate)
  const phase = contest.isCompleted ? 'completed' : ratingEnded ? 'ended' : uploadEnded ? 'rating' : 'upload'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'photographers', label: 'Photographers', icon: <Image size={15} /> },
    { key: 'topics', label: 'Topics', icon: <Tag size={15} /> },
    { key: 'judges', label: 'Judges', icon: <Users size={15} /> },
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
          {contest.reward && (
            <p className="text-sm text-indigo-600 mt-1">Reward: {contest.reward}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Uploads until {new Date(contest.uploadEndDate).toLocaleDateString()} · Ratings until {new Date(contest.ratingEndDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Link
            to={`/results/${contestId}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View Results
          </Link>
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
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
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
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'photographers' && <PhotographersTab contestId={contestId} contest={contest} />}
      {tab === 'topics' && <TopicsTab contestId={contestId} />}
      {tab === 'judges' && <JudgesTab contestId={contestId} />}
    </div>
  )
}
