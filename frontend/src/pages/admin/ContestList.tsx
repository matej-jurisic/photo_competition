import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, Trophy } from 'lucide-react'
import { api } from '../../api/client'

export default function ContestList() {
  const qc = useQueryClient()
  const { data: contests, isLoading, error } = useQuery({
    queryKey: ['contests'],
    queryFn: api.contests.list,
  })

  const del = useMutation({
    mutationFn: api.contests.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  })

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (error) return <p className="text-red-500">Failed to load contests. Check your admin key.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contests</h1>
        <Link
          to="/admin/contests/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> New Contest
        </Link>
      </div>

      {contests?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-40" />
          <p>No contests yet. Create your first one.</p>
        </div>
      )}

      <div className="grid gap-3">
        {contests?.map(c => {
          const ended = new Date(c.endDate) < new Date()
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{c.name}</span>
                  {ended
                    ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ended</span>
                    : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  }
                </div>
                {c.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  End: {new Date(c.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/results/${c.id}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Results
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Delete this contest and all its data?')) del.mutate(c.id)
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 size={15} />
                </button>
                <Link
                  to={`/admin/contests/${c.id}`}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
