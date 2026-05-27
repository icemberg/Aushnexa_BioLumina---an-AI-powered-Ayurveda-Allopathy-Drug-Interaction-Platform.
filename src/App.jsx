import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/appStore'
import React, { Suspense } from 'react'

// Layout Components
import DisclaimerBanner from './components/DisclaimerBanner'
import TopNavBar from './components/TopNavBar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy Loaded Pages
const Landing = React.lazy(() => import('./pages/Landing'))
const Portal = React.lazy(() => import('./pages/Portal'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const Checker = React.lazy(() => import('./pages/Checker'))
const AdminLogs = React.lazy(() => import('./pages/AdminLogs'))
const AdminSideNav = React.lazy(() => import('./components/AdminSideNav'))
const Results = React.lazy(() => import('./pages/Results'))
const History = React.lazy(() => import('./pages/History'))
const Login = React.lazy(() => import('./pages/Login'))
const Register = React.lazy(() => import('./pages/Register'))
const KnowledgeGraph = React.lazy(() => import('./pages/KnowledgeGraph'))
const AushnexaAI = React.lazy(() => import('./pages/AushnexaAI'))
const EvidencePortal = React.lazy(() => import('./pages/EvidencePortal'))
const CompoundReport = React.lazy(() => import('./pages/CompoundReport'))

// Setup React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Layout wrapper to conditionally show TopNavBar and Footer
function MainLayout({ children }) {
  const location = useLocation()

  const isDashboard = location.pathname.startsWith('/dashboard')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isFullScreen = location.pathname === '/knowledge-graph' || location.pathname.startsWith('/knowledge/compound/')

  const isAdminRoute = location.pathname.startsWith('/admin') || isDashboard;
  const hideLayout = isDashboard || isAuthPage || isFullScreen || isAdminRoute;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {!hideLayout && <DisclaimerBanner />}
      {!hideLayout && <TopNavBar />}
      {isAdminRoute && <AdminSideNav />}

      {/* The main content takes the remaining space and pushes footer down */}
      <main className="flex-grow flex flex-col relative w-full">
        {children}
      </main>

      {!hideLayout && <Footer />}
    </div>
  )
}

import toast, { Toaster } from 'react-hot-toast'

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex-grow flex items-center justify-center bg-surface-lowest min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="font-technical-sm text-sm text-primary tracking-widest uppercase animate-pulse">Initializing Sequence...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAppStore(s => ({ isAuthenticated: s.isAuthenticated, user: s.user }))

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    toast.error("Access denied")
    return <Navigate to="/checker" replace />
  }
  return children
}

// Custom route for the index path
function IndexRoute() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  return isAuthenticated ? <Portal /> : <Landing />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" toastOptions={{ className: 'font-sans' }} />
          <MainLayout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<IndexRoute />} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminLogs /></ProtectedRoute>} />
                <Route path="/checker" element={<Checker />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
                <Route path="/knowledge/compound/*" element={<CompoundReport />} />
                <Route path="/ai" element={<AushnexaAI />} />
                <Route path="/trials" element={<EvidencePortal />} />

                {/* Catch-all route for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
