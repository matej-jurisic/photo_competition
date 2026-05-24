import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import AppHeader from '../../components/AppHeader'

export default function UserPhotographerSessionPage() {
  const { contestId } = useParams()
  const id = Number(contestId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['userSession', 'photographer', id],
    queryFn: () => api.userSession.getPhotographerSession(id),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <div className="p-6 text-gray-400">Loading session...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <div className="p-6 text-red-500">You are not a photographer in this contest or the contest does not exist.</div>
      </div>
    )
  }

  // Redirect to the existing photographer page using the token
  return <Navigate to={`/photographer/${data.photographer.token}`} replace />
}
