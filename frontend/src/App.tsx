import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './pages/admin/AdminLayout'
import ContestList from './pages/admin/ContestList'
import ContestForm from './pages/admin/ContestForm'
import ContestDetail from './pages/admin/ContestDetail'
import JudgePage from './pages/judge/JudgePage'
import ResultsPage from './pages/results/ResultsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ContestList />} />
        <Route path="contests/new" element={<ContestForm />} />
        <Route path="contests/:id/edit" element={<ContestForm />} />
        <Route path="contests/:id" element={<ContestDetail />} />
      </Route>
      <Route path="/judge/:token" element={<JudgePage />} />
      <Route path="/results/:contestId" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
