import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './pages/admin/AdminLayout'
import ContestList from './pages/admin/ContestList'
import ContestForm from './pages/admin/ContestForm'
import ContestDetail from './pages/admin/ContestDetail'
import JudgePage from './pages/judge/JudgePage'
import ResultsPage from './pages/results/ResultsPage'
import PhotographerPage from './pages/photographer/PhotographerPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ContestBrowserPage from './pages/user/ContestBrowserPage'
import UserDashboardPage from './pages/user/UserDashboardPage'
import UserJudgeSessionPage from './pages/user/UserJudgeSessionPage'
import UserPhotographerSessionPage from './pages/user/UserPhotographerSessionPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public contest browser */}
      <Route path="/contests" element={<ContestBrowserPage />} />

      {/* Protected user routes */}
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
      <Route path="/my-sessions/judge/:contestId" element={<ProtectedRoute><UserJudgeSessionPage /></ProtectedRoute>} />
      <Route path="/my-sessions/photographer/:contestId" element={<ProtectedRoute><UserPhotographerSessionPage /></ProtectedRoute>} />

      {/* Legacy admin routes — unchanged */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ContestList />} />
        <Route path="contests/new" element={<ContestForm />} />
        <Route path="contests/:id/edit" element={<ContestForm />} />
        <Route path="contests/:id" element={<ContestDetail />} />
      </Route>

      {/* Legacy token-based participant routes — unchanged */}
      <Route path="/judge/:token" element={<JudgePage />} />
      <Route path="/photographer/:token" element={<PhotographerPage />} />
      <Route path="/results/:contestId" element={<ResultsPage />} />

      {/* Default to contest browser instead of admin */}
      <Route path="*" element={<Navigate to="/contests" replace />} />
    </Routes>
  )
}
