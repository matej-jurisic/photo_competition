import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Camera, Star, CheckCircle, AlertTriangle, Gift } from 'lucide-react'
import { api } from '../../api/client'
import type { Topic } from '../../api/types'

interface LocalRating {
  photoId: number
  score: number
  comment: string
}

export default function JudgePage() {
  const { token } = useParams<{ token: string }>()
  const [ratings, setRatings] = useState<Record<number, LocalRating>>({})
  const [saved, setSaved] = useState(false)

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', token],
    queryFn: () => api.session.get(token!),
    enabled: !!token,
  })

  useEffect(() => {
    if (session?.existingRatings) {
      const init: Record<number, LocalRating> = {}
      for (const r of session.existingRatings) {
        init[r.photoId] = { photoId: r.photoId, score: r.score, comment: r.comment ?? '' }
      }
      setRatings(init)
    }
  }, [session])

  const submit = useMutation({
    mutationFn: () => {
      const list = Object.values(ratings)
      return api.session.submitRatings(token!, list.map(r => ({ ...r, comment: r.comment })))
    },
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading your rating session...</p>
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
        <p className="text-gray-700 font-medium">Invalid or expired judge link.</p>
      </div>
    </div>
  )

  const contest = session.contest
  const now = new Date()
  const isNotYetOpen = now < new Date(contest.uploadEndDate)
  const isEnded = now > new Date(contest.ratingEndDate)
  const BASE = import.meta.env.VITE_API_URL ?? ''

  const totalPhotos = contest.photographers.reduce((s, p) => s + p.photos.length, 0)
  const ratedCount = Object.keys(ratings).length

  function setRating(photoId: number, score: number, comment: string) {
    setRatings(prev => ({ ...prev, [photoId]: { photoId, score, comment } }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="text-indigo-600" size={22} />
            <div>
              <h1 className="font-bold text-gray-900">{contest.name}</h1>
              <p className="text-xs text-gray-500">Judge: {session.judge.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{ratedCount}/{totalPhotos} rated</span>
            {!isEnded && !isNotYetOpen && (
              <button
                onClick={() => submit.mutate()}
                disabled={submit.isPending || ratedCount === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {saved ? <><CheckCircle size={15} /> Saved!</> : submit.isPending ? 'Saving...' : 'Save Ratings'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isNotYetOpen && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm">
            Rating opens after the upload deadline on {new Date(contest.uploadEndDate).toLocaleDateString()}.
          </div>
        )}

        {isEnded && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            This contest has ended. Ratings are now closed.
          </div>
        )}

        {contest.reward && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
            <Gift size={18} className="text-indigo-500 flex-shrink-0" />
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Reward</span>
              <p className="text-sm text-indigo-900 mt-0.5">{contest.reward}</p>
            </div>
          </div>
        )}

        {contest.topics.map((topic: Topic) => {
          return (
            <div key={topic.id} className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                {topic.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contest.photographers.map(photographer => {
                  const photos = photographer.photos.filter(ph => ph.topicId === topic.id)
                  if (photos.length === 0) return (
                    <div key={photographer.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="font-semibold text-gray-700 mb-3">{photographer.name}</div>
                      <p className="text-sm text-gray-400">No photos uploaded yet.</p>
                    </div>
                  )

                  return (
                    <div key={photographer.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="font-semibold text-gray-800 mb-4">{photographer.name}</div>
                      <div className="space-y-5">
                        {photos.map(photo => {
                          const r = ratings[photo.id]
                          return (
                            <div key={photo.id}>
                              <img
                                src={`${BASE}${photo.imageUrl}`}
                                alt={photo.title ?? ''}
                                className="w-full rounded-lg"
                              />
                              {photo.title && (
                                <p className="text-xs text-gray-500 mt-1">{photo.title}</p>
                              )}
                              <div className="mt-3">
                                <div className="flex items-center gap-1 mb-2">
                                  {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                    <button
                                      key={score}
                                      disabled={isEnded || isNotYetOpen}
                                      onClick={() => setRating(photo.id, score, r?.comment ?? '')}
                                      className={`w-7 h-7 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                                        r?.score === score
                                          ? 'bg-indigo-600 text-white'
                                          : r?.score && score <= r.score
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  disabled={isEnded || isNotYetOpen}
                                  placeholder="Comment (optional)"
                                  value={r?.comment ?? ''}
                                  onChange={e => setRating(photo.id, r?.score ?? 0, e.target.value)}
                                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!isEnded && !isNotYetOpen && ratedCount > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saved ? <><CheckCircle size={16} /> Saved!</> : <><Star size={16} /> Save Ratings ({ratedCount}/{totalPhotos})</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
