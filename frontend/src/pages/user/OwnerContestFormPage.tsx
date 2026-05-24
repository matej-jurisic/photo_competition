import { useNavigate } from 'react-router-dom'
import ContestForm from '../admin/ContestForm'
import AppHeader from '../../components/AppHeader'

export default function OwnerContestFormPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <ContestForm
          onSuccess={id => navigate(`/my-contests/${id}`)}
          basePath="/my-contests"
        />
      </main>
    </div>
  )
}
