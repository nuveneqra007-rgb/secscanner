import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewScanPage from './pages/NewScanPage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import NewFileScanPage from './pages/NewFileScanPage'
import FileReportPage from './pages/FileReportPage'
import FileHistoryPage from './pages/FileHistoryPage'
import ScheduledScansPage from './pages/ScheduledScansPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas dentro del Layout — accesibles con y sin cuenta */}
            <Route element={<Layout />}>
              {/* Rutas privadas — redirigen a login si no autenticado */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/file-history"
                element={
                  <ProtectedRoute>
                    <FileHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scheduled"
                element={
                  <ProtectedRoute>
                    <ScheduledScansPage />
                  </ProtectedRoute>
                }
              />

              {/* Rutas públicas — accesibles sin cuenta */}
              <Route path="/scan" element={<NewScanPage />} />
              <Route path="/new-file-scan" element={<NewFileScanPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
              <Route path="/file-report/:id" element={<FileReportPage />} />

              {/* Compatibilidad hacia atrás */}
              <Route path="/new-scan" element={<Navigate to="/scan" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-slate-800 !text-slate-100 !border !border-slate-700',
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
