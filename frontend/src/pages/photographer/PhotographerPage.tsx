import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Upload, X, AlertTriangle, CheckCircle, Gift, Users } from 'lucide-react'
import { api } from '../../api/client'

export default function PhotographerPage() {
  const { token } = useParams<{ token: string }>()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadForTopic, setUploadForTopic] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [justUploaded, setJustUploaded] = useState<number | null>(null)
  const [showCompetitors, setShowCompetitors] = useState(false)

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['photographer-session', token],
    queryFn: () => api.photographerSession.get(token!),
    enabled: !!token,
  })

  const { data: competitors } = useQuery({
    queryKey: ['photographer-competitors', token],
    queryFn: () => api.photographerSession.competitors(token!),
    enabled: !!token && showCompetitors,
  })

  const delPhoto = useMutation({
    mutationFn: (photoId: number) => api.photographerSession.deletePhoto(token!, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photographer-session', token] }),
  })

  async function handleUpload(file: File) {
    if (!uploadForTopic || !token) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('topicId', String(uploadForTopic))
    try {
      await api.photographerSession.upload(token, fd)
      qc.invalidateQueries({ queryKey: ['photographer-session', token] })
      setJustUploaded(uploadForTopic)
      setTimeout(() => setJustUploaded(null), 2000)
      setUploadForTopic(null)
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
        <p className="text-gray-700 font-medium">Invalid or expired link.</p>
      </div>
    </div>
  )

  const isEnded = session.contest.isCompleted || new Date() > new Date(session.contest.uploadEndDate)
  const BASE = import.meta.env.VITE_API_URL ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Camera className="text-indigo-600" size={22} />
          <div>
            <h1 className="font-bold text-gray-900">{session.contest.name}</h1>
            <p className="text-xs text-gray-500">{session.photographer.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCompetitors(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <Users size={14} />
              Competitors
            </button>
            {isEnded && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Uploads closed</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {isEnded && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            The upload deadline has passed. You can no longer upload or change photos.
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {session.contest.description && (
            <p className="text-sm text-gray-700">{session.contest.description}</p>
          )}
          {session.contest.rewards.length > 0 && (
            <div className="flex items-start gap-2">
              <Gift size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <ul className="space-y-0.5">
                {session.contest.rewards.map((r, i) => (
                  <li key={i} className="text-sm font-medium text-indigo-700">{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <span>Upload deadline: {new Date(session.contest.uploadEndDate).toLocaleDateString()}</span>
            <span>Judging closes: {new Date(session.contest.ratingEndDate).toLocaleDateString()}</span>
          </div>
        </div>

        {session.topics.map(topic => {
          const photo = session.photographer.photos.find(ph => ph.topicId === topic.id)
          const uploaded = justUploaded === topic.id

          return (
            <div key={topic.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">{topic.name}</h2>
                {uploaded && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={13} /> Uploaded
                  </span>
                )}
              </div>

              {photo ? (
                <div className="relative group inline-block">
                  <img
                    src={`${BASE}${photo.imageUrl}`}
                    alt=""
                    className="max-h-72 rounded-lg object-contain border border-gray-200"
                  />
                  {!isEnded && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <button
                        onClick={() => { setUploadForTopic(topic.id); fileRef.current?.click() }}
                        className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg shadow font-medium hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Upload size={12} /> Replace
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this photo?')) delPhoto.mutate(photo.id) }}
                        className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow font-medium hover:bg-red-600 flex items-center gap-1"
                      >
                        <X size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                !isEnded && (
                  <button
                    onClick={() => { setUploadForTopic(topic.id); fileRef.current?.click() }}
                    className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    <Upload size={22} />
                    <span className="text-sm mt-2">Upload photo</span>
                  </button>
                )
              )}

              {!photo && isEnded && (
                <p className="text-sm text-gray-400">No photo uploaded.</p>
              )}
            </div>
          )
        })}
      </div>

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
          <div className="bg-white rounded-xl p-6 text-sm text-gray-700">Uploading...</div>
        </div>
      )}

      {showCompetitors && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCompetitors(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Competitors</h2>
              </div>
              <button onClick={() => setShowCompetitors(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            {!competitors ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : competitors.length === 0 ? (
              <p className="text-sm text-gray-400">No other competitors yet.</p>
            ) : (
              <ul className="space-y-2">
                {competitors.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {name[0]?.toUpperCase()}
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
