import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Alarms from './components/Alarms';
import Commands from './components/Commands';
import History from './components/History';
import OpcuaView from './components/OpcuaView';
import MotorDiagnostics from './components/MotorDiagnostics';
import OpcPerformance from './components/OpcPerformance';

function PrivateRoute({ children, requireMaintenance = false }) {
  const { isAuthenticated, isMaintenance, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-16 h-16" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireMaintenance && !isMaintenance) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="spinner w-16 h-16 border-white border-t-primary-200" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="alarms" element={<Alarms />} />
        <Route path="history" element={<History />} />
        <Route path="opcua" element={<OpcuaView />} />
        <Route path="motor-diagnostics" element={<MotorDiagnostics />} />
        <Route path="opc-performance" element={<OpcPerformance />} />
        <Route
          path="commands"
          element={
            <PrivateRoute requireMaintenance>
              <Commands />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
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
