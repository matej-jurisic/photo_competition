import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { api } from '../../api/client'

function toEndOfDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}

function toLocalDateInputValue(isoString: string): string {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface ContestFormProps {
  onSuccess?: (id: number) => void
  basePath?: string
}

export default function ContestForm({ onSuccess, basePath = '/admin/contests' }: ContestFormProps) {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rewards, setRewards] = useState<string[]>([])
  const [badges, setBadges] = useState<{ name: string; allowedCount: number }[]>([])
  const [uploadEndDate, setUploadEndDate] = useState('')
  const [ratingEndDate, setRatingEndDate] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState('')

  const { data: existing } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => api.contests.get(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description ?? '')
      setRewards(existing.rewards ?? [])
      setBadges(existing.badges.map(b => ({ name: b.name, allowedCount: b.allowedCount })))
      setUploadEndDate(toLocalDateInputValue(existing.uploadEndDate))
      setRatingEndDate(toLocalDateInputValue(existing.ratingEndDate))
      setIsPublic(existing.isPublic)
    }
  }, [existing])

  const create = useMutation({
    mutationFn: (d: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[]; badges: { name: string; allowedCount: number }[]; isPublic: boolean }) => api.contests.create(d),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['contests'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'owned'] })
      if (onSuccess) onSuccess(c.id)
      else navigate(`${basePath}/${c.id}`)
    },
    onError: () => setError('Failed to save. Check your admin key or login status.'),
  })

  const update = useMutation({
    mutationFn: (d: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[]; badges: { name: string; allowedCount: number }[]; isPublic: boolean }) => api.contests.update(Number(id), d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'owned'] })
      if (onSuccess) onSuccess(Number(id))
      else navigate(`${basePath}/${id}`)
    },
    onError: () => setError('Failed to save.'),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !uploadEndDate || !ratingEndDate) {
      setError('Name, upload deadline, and rating deadline are required.')
      return
    }
    if (new Date(ratingEndDate) <= new Date(uploadEndDate)) {
      setError('Rating deadline must be after the upload deadline.')
      return
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      rewards: rewards.map(r => r.trim()).filter(r => r.length > 0),
      badges: badges.filter(b => b.name.trim().length > 0).map(b => ({ name: b.name.trim(), allowedCount: b.allowedCount })),
      uploadEndDate: toEndOfDay(uploadEndDate),
      ratingEndDate: toEndOfDay(ratingEndDate),
      isPublic,
    }
    if (isEdit) update.mutate(payload)
    else create.mutate(payload)
  }

  const isPending = create.isPending || update.isPending

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Contest' : 'New Contest'}</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Name *</span>
          <input
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>
        <div>
          <span className="text-sm font-medium text-gray-700">Rewards</span>
          <div className="mt-1 flex flex-col gap-2">
            {rewards.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Trophy + €200 voucher"
                  value={r}
                  onChange={e => setRewards(rewards.map((v, j) => j === i ? e.target.value : v))}
                />
                <button
                  type="button"
                  onClick={() => setRewards(rewards.filter((_, j) => j !== i))}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRewards([...rewards, ''])}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 self-start"
            >
              <Plus size={15} /> Add reward
            </button>
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Special Badges</span>
          <p className="text-xs text-gray-500 mt-0.5 mb-1">Judges can award these badges to photos. Set the name and how many times each badge can be used per judge.</p>
          <div className="flex flex-col gap-2">
            {badges.map((b, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Badge name"
                  value={b.name}
                  onChange={e => setBadges(badges.map((v, j) => j === i ? { ...v, name: e.target.value } : v))}
                />
                <input
                  type="number"
                  min={1}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Allowed uses per judge"
                  value={b.allowedCount}
                  onChange={e => setBadges(badges.map((v, j) => j === i ? { ...v, allowedCount: Math.max(1, Number(e.target.value)) } : v))}
                />
                <button
                  type="button"
                  onClick={() => setBadges(badges.filter((_, j) => j !== i))}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBadges([...badges, { name: '', allowedCount: 1 }])}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 self-start"
            >
              <Plus size={15} /> Add badge
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Upload Deadline *</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={uploadEndDate}
              onChange={e => setUploadEndDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Rating Deadline *</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={ratingEndDate}
              min={uploadEndDate}
              onChange={e => setRatingEndDate(e.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{isPublic ? 'Public' : 'Private'}</p>
            <p className="text-xs text-gray-400">{isPublic ? 'Anyone can discover and request to join' : 'Hidden from browse — only admin can add participants'}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(v => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isPublic ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contest'}
        </button>
      </form>
    </div>
  )
}
