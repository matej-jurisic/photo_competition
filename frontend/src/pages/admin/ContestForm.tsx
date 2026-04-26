import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { api } from '../../api/client'

export default function ContestForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rewards, setRewards] = useState<string[]>([])
  const [uploadEndDate, setUploadEndDate] = useState('')
  const [ratingEndDate, setRatingEndDate] = useState('')
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
      setUploadEndDate(existing.uploadEndDate.slice(0, 10))
      setRatingEndDate(existing.ratingEndDate.slice(0, 10))
    }
  }, [existing])

  const create = useMutation({
    mutationFn: (d: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[] }) => api.contests.create(d),
    onSuccess: c => { qc.invalidateQueries({ queryKey: ['contests'] }); navigate(`/admin/contests/${c.id}`) },
    onError: () => setError('Failed to save. Check your admin key.'),
  })

  const update = useMutation({
    mutationFn: (d: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[] }) => api.contests.update(Number(id), d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contests'] }); navigate(`/admin/contests/${id}`) },
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
      uploadEndDate: new Date(uploadEndDate).toISOString(),
      ratingEndDate: new Date(ratingEndDate).toISOString(),
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
