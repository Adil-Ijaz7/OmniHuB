import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LiveTV from "./pages/tools/LiveTV";
import TamashaOTP from "./pages/tools/TamashaOTP";
import TempEmail from "./pages/tools/TempEmail";
import YouTubeDownloader from "./pages/tools/YouTubeDownloader";
import ImageEnhance from "./pages/tools/ImageEnhance";
import PhoneLookup from "./pages/tools/PhoneLookup";
import EyeconLookup from "./pages/tools/EyeconLookup";
import UsageHistory from "./pages/UsageHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCredits from "./pages/admin/AdminCredits";
import AdminLogs from "./pages/admin/AdminLogs";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layout
import Layout from "./components/Layout";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/live-tv"
        element={
          <ProtectedRoute>
            <Layout>
              <LiveTV />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/tamasha-otp"
        element={
          <ProtectedRoute>
            <Layout>
              <TamashaOTP />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/temp-email"
        element={
          <ProtectedRoute>
            <Layout>
              <TempEmail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/youtube-downloader"
        element={
          <ProtectedRoute>
            <Layout>
              <YouTubeDownloader />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/image-enhance"
        element={
          <ProtectedRoute>
            <Layout>
              <ImageEnhance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/phone-lookup"
        element={
          <ProtectedRoute>
            <Layout>
              <PhoneLookup />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/eyecon-lookup"
        element={
          <ProtectedRoute>
            <Layout>
              <EyeconLookup />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usage-history"
        element={
          <ProtectedRoute>
            <Layout>
              <UsageHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/credits"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminCredits />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
