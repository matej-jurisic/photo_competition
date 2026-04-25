import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Upload, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { api } from '../../api/client'

export default function PhotographerPage() {
  const { token } = useParams<{ token: string }>()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadForTopic, setUploadForTopic] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [justUploaded, setJustUploaded] = useState<number | null>(null)

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['photographer-session', token],
    queryFn: () => api.photographerSession.get(token!),
    enabled: !!token,
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

  const isEnded = new Date(session.contest.endDate) < new Date()
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
          {isEnded && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Contest ended</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {isEnded && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            This contest has ended. You can no longer upload or change photos.
          </div>
        )}

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
          if (file) handleUpload(file)
          e.target.value = ''
        }}
      />

      {uploading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-sm text-gray-700">Uploading...</div>
        </div>
      )}
    </div>
  )
}
