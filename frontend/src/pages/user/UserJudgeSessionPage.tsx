import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import AppHeader from '../../components/AppHeader'

export default function UserJudgeSessionPage() {
  const { contestId } = useParams()
  const id = Number(contestId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['userSession', 'judge', id],
    queryFn: () => api.userSession.getJudgeSession(id),
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
        <div className="p-6 text-red-500">You are not a judge in this contest or the contest does not exist.</div>
      </div>
    )
  }

  // Redirect to the existing judge page using the token
  return <Navigate to={`/judge/${data.judge.token}`} replace />
}
