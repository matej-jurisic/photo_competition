import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Upload, X, Link, Check } from 'lucide-react'
import { api } from '../../api/client'
import type { ContestDetail, Topic } from '../../api/types'

interface Props {
  contestId: number
  contest: ContestDetail
}

export default function PhotographersTab({ contestId, contest }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [uploadFor, setUploadFor] = useState<{ photographerId: number; topicId: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/photographer/${token}`)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const { data: photographers } = useQuery({
    queryKey: ['photographers', contestId],
    queryFn: () => api.photographers.list(contestId),
    initialData: contest.photographers,
  })

  const topics = contest.topics

  const create = useMutation({
    mutationFn: () => api.photographers.create(contestId, { name: name.trim(), bio: bio.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
      setName('')
      setBio('')
    },
  })

  const update = useMutation({
    mutationFn: (id: number) => api.photographers.update(id, { name: editName.trim(), bio: editBio.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
      setEditingId(null)
    },
  })

  const del = useMutation({
    mutationFn: api.photographers.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
    },
  })

  const delPhoto = useMutation({
    mutationFn: api.photos.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
    },
  })

  async function handleUpload(file: File) {
    if (!uploadFor) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('photographerId', String(uploadFor.photographerId))
    fd.append('topicId', String(uploadFor.topicId))
    try {
      await api.photos.upload(fd)
      qc.invalidateQueries({ queryKey: ['photographers', contestId] })
      qc.invalidateQueries({ queryKey: ['contest', String(contestId)] })
      setUploadFor(null)
    } finally {
      setUploading(false)
    }
  }

  const BASE = import.meta.env.VITE_API_URL ?? ''

  return (
    <div className="space-y-4">
      {/* Add photographer */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Photographer</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Bio (optional)"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Add topics first before uploading photos.
        </p>
      )}

      {/* One card per photographer, topics stacked inside */}
      {photographers?.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
          {editingId === p.id ? (
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
              />
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Bio"
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
              />
              <button onClick={() => update.mutate(p.id)} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Save</button>
              <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <span className="font-semibold text-gray-900">{p.name}</span>
                {p.bio && <span className="text-sm text-gray-500 ml-2">{p.bio}</span>}
              </div>
              <button
                onClick={() => copyLink(p.token)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${copiedToken === p.token ? 'bg-green-50 text-green-700' : 'text-indigo-600 hover:bg-indigo-50'}`}
              >
                {copiedToken === p.token ? <><Check size={12} /> Copied</> : <><Link size={12} /> Copy link</>}
              </button>
              <button onClick={() => { setEditingId(p.id); setEditName(p.name); setEditBio(p.bio ?? '') }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
              <button onClick={() => { if (confirm('Delete photographer and all their photos?')) del.mutate(p.id) }} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={14} /></button>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {topics.map((t: Topic) => {
              const photo = p.photos.find(ph => ph.topicId === t.id)
              return (
                <div key={t.id} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-500">{t.name}</span>
                  {photo ? (
                    <div className="relative group w-32 h-32">
                      <img
                        src={`${BASE}${photo.imageUrl}`}
                        alt=""
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => { if (confirm('Delete this photo?')) delPhoto.mutate(photo.id) }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setUploadFor({ photographerId: p.id, topicId: t.id }); fileRef.current?.click() }}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      <Upload size={16} />
                      <span className="text-xs mt-1">Upload</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 20 * 1024 * 1024) {
            setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`)
            e.target.value = ''
            return
          }
          setUploadError(null)
          handleUpload(file)
          e.target.value = ''
        }}
      />

      {uploadError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="text-red-200 hover:text-white font-bold">✕</button>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-sm text-gray-700">Uploading photo...</div>
        </div>
      )}
    </div>
  )
}
