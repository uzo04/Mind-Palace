import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MySpacesPage from './pages/MySpacesPage';
import CreateSpacePage from './pages/CreateSpacePage';
import SpaceStudioPage from './pages/SpaceStudioPage';
import RecallPage from './pages/RecallPage';
import QuizPage from './pages/QuizPage';
import RecallModePage from './pages/RecallModePage';
import QuizHubPage from './pages/QuizHubPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loader">Зареждане…</div>;
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loader">Зареждане…</div>;
  return isAuthenticated ? <Navigate to="/spaces" replace /> : children;
}

function HomeRoute() {
  const { loading } = useAuth();
  if (loading) return <div className="page-loader">Зареждане...</div>;
  return <AppShell><HomePage /></AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
      <Route path="/" element={<HomeRoute />} />
      <Route path="/spaces" element={<ProtectedRoute><AppShell><MySpacesPage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/new" element={<ProtectedRoute><AppShell><CreateSpacePage /></AppShell></ProtectedRoute>} />
      <Route path="/recall" element={<ProtectedRoute><AppShell><RecallModePage /></AppShell></ProtectedRoute>} />
      <Route path="/quizzes" element={<ProtectedRoute><AppShell><QuizHubPage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/:id" element={<ProtectedRoute><AppShell><SpaceStudioPage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/:id/recall" element={<ProtectedRoute><AppShell><RecallModePage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/:id/recall/:startIndex" element={<ProtectedRoute><AppShell><RecallPage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/:id/quiz" element={<ProtectedRoute><AppShell><QuizHubPage /></AppShell></ProtectedRoute>} />
      <Route path="/spaces/:id/quiz/start" element={<ProtectedRoute><AppShell><QuizPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin" element={<Navigate to="/administration" replace />} />
      <Route path="/administration" element={<ProtectedRoute><AdminRoute><AppShell><AdminPage /></AppShell></AdminRoute></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
