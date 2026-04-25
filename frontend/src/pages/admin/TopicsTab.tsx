import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { api } from '../../api/client'

export default function TopicsTab({ contestId }: { contestId: number }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const { data: topics } = useQuery({
    queryKey: ['topics', contestId],
    queryFn: () => api.topics.list(contestId),
  })

  const create = useMutation({
    mutationFn: () => api.topics.create(contestId, { name: name.trim(), orderIndex: (topics?.length ?? 0) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics', contestId] }); qc.invalidateQueries({ queryKey: ['contest', String(contestId)] }); setName('') },
  })

  const update = useMutation({
    mutationFn: (id: number) => {
      const t = topics?.find(x => x.id === id)!
      return api.topics.update(id, { name: editName.trim(), orderIndex: t.orderIndex })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics', contestId] }); qc.invalidateQueries({ queryKey: ['contest', String(contestId)] }); setEditingId(null) },
  })

  const del = useMutation({
    mutationFn: api.topics.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics', contestId] }); qc.invalidateQueries({ queryKey: ['contest', String(contestId)] }) },
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Topic</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Topic name (e.g. Landscape, Portrait)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create.mutate()}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {topics?.map((t, i) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
            {editingId === t.id ? (
              <>
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && update.mutate(t.id)}
                  autoFocus
                />
                <button onClick={() => update.mutate(t.id)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-gray-800">{t.name}</span>
                <button onClick={() => { setEditingId(t.id); setEditName(t.name) }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                <button onClick={() => { if (confirm('Delete this topic? All photos in this topic will be deleted.')) del.mutate(t.id) }} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
        {topics?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No topics yet.</p>
        )}
      </div>
    </div>
  )
}
