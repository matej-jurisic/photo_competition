import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Check, Link } from 'lucide-react'
import { api } from '../../api/client'

export default function JudgesTab({ contestId }: { contestId: number }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: judges } = useQuery({
    queryKey: ['judges', contestId],
    queryFn: () => api.judges.list(contestId),
  })

  const create = useMutation({
    mutationFn: () => api.judges.create(contestId, { name: name.trim(), email: email.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['judges', contestId] }); setName(''); setEmail('') },
  })

  const update = useMutation({
    mutationFn: (id: number) => api.judges.update(id, { name: editName.trim(), email: editEmail.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['judges', contestId] }); setEditingId(null) },
  })

  const del = useMutation({
    mutationFn: api.judges.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['judges', contestId] }),
  })

  async function copyLink(token: string) {
    const link = `${window.location.origin}/judge/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Judge</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
        {judges?.map(j => (
          <div key={j.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            {editingId === j.id ? (
              <>
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
                <button onClick={() => update.mutate(j.id)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100">Cancel</button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{j.name}</div>
                  {j.email && <div className="text-xs text-gray-500 truncate">{j.email}</div>}
                  <div className="text-xs text-gray-400 font-mono truncate mt-0.5">{j.token}</div>
                </div>
                <button
                  onClick={() => copyLink(j.token)}
                  title="Copy judge link"
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                    copiedId === j.token
                      ? 'bg-green-50 text-green-700'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {copiedId === j.token ? <><Check size={12} /> Copied</> : <><Link size={12} /> Copy link</>}
                </button>
                <button onClick={() => { setEditingId(j.id); setEditName(j.name); setEditEmail(j.email ?? '') }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                <button onClick={() => { if (confirm('Delete this judge? Their ratings will also be deleted.')) del.mutate(j.id) }} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
        {judges?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No judges yet.</p>
        )}
      </div>
    </div>
  )
}
