import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Check, Link, Copy } from 'lucide-react'
import { api } from '../../api/client'
import type { UserSummary } from '../../api/types'
import UserSearchInput from '../../components/UserSearchInput'

export default function JudgesTab({ contestId }: { contestId: number }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedUser, setLinkedUser] = useState<UserSummary | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data: judges } = useQuery({
    queryKey: ['judges', contestId],
    queryFn: () => api.judges.list(contestId),
  })

  const [createError, setCreateError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => api.judges.create(contestId, {
      name: linkedUser ? linkedUser.displayName : name.trim(),
      email: linkedUser ? '' : email.trim(),
      userId: linkedUser?.id,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['judges', contestId] }); setName(''); setEmail(''); setLinkedUser(null); setCreateError(null) },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setCreateError(typeof msg === 'string' ? msg : 'Failed to add judge.')
    },
  })

  const update = useMutation({
    mutationFn: (id: number) => api.judges.update(id, { name: editName.trim(), email: editEmail.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['judges', contestId] }); setEditingId(null) },
  })

  const del = useMutation({
    mutationFn: api.judges.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['judges', contestId] }),
  })

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (!judges) return
    setSelected(selected.size === judges.length ? new Set() : new Set(judges.map(j => j.id)))
  }

  async function copyLinks() {
    if (!judges?.length) return
    const targets = selected.size > 0 ? judges.filter(j => selected.has(j.id)) : judges
    const text = targets.map(j => `${j.name}: ${window.location.origin}/judge/${j.token}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

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
        <UserSearchInput
          selected={linkedUser}
          onSelect={user => { setLinkedUser(user); setCreateError(null) }}
          placeholder="Search registered users..."
        />
        {linkedUser ? (
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="mt-2 flex items-center justify-center gap-1 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add {linkedUser.displayName}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or add manually</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Email (optional)"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button
                onClick={() => create.mutate()}
                disabled={!name.trim() || create.isPending}
                className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </>
        )}
        {createError && (
          <p className="text-xs text-red-600 mt-2">{createError}</p>
        )}
      </div>

      {judges && judges.length > 1 && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.size === judges.length}
              ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < judges.length }}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </label>
          <button
            onClick={copyLinks}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              copiedAll ? 'bg-green-50 text-green-700' : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            {copiedAll
              ? <><Check size={12} /> Copied</>
              : selected.size > 0
                ? <><Copy size={12} /> Copy {selected.size} links</>
                : <><Copy size={12} /> Copy all links</>
            }
          </button>
        </div>
      )}

      <div className="space-y-2">
        {judges?.map(j => (
          <div key={j.id} className="bg-white rounded-xl border border-gray-200 p-3">
            {editingId === j.id ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => update.mutate(j.id)} className="flex-1 sm:flex-none text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">Save</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 sm:flex-none text-xs text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                {judges && judges.length > 1 && (
                  <input
                    type="checkbox"
                    checked={selected.has(j.id)}
                    onChange={() => toggleSelect(j.id)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{j.name}</div>
                  {j.email && <div className="text-xs text-gray-500 truncate">{j.email}</div>}
                  <div className="text-xs text-gray-400 font-mono truncate mt-0.5">{j.token}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => copyLink(j.token)}
                    title="Copy judge link"
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      copiedId === j.token ? 'bg-green-50 text-green-700' : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {copiedId === j.token ? <><Check size={12} /> Copied</> : <><Link size={12} /> Copy</>}
                  </button>
                  <button onClick={() => { setEditingId(j.id); setEditName(j.name); setEditEmail(j.email ?? '') }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                  <button onClick={() => { if (confirm('Delete this judge? Their ratings will also be deleted.')) del.mutate(j.id) }} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
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
