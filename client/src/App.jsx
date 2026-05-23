import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, getAccessToken, setAccessToken } from './store/authStore';
import { authService } from './services/authService';
import { adminService } from './services/adminService';

// Public layouts & pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/public/Home';
import RestaurantPage from './pages/public/RestaurantPage';
import Maintenance from './pages/public/Maintenance';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin (restaurant OS) layout & pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import POS from './pages/admin/POS';
import Tables from './pages/admin/Tables';
import Kitchen from './pages/admin/Kitchen';
import Menu from './pages/admin/Menu';
import Orders from './pages/admin/Orders';
import Reservations from './pages/admin/Reservations';
import Staff from './pages/admin/Staff';
import Settings from './pages/admin/Settings';
import KYC from './pages/admin/KYC';
import RestaurantSetup from './pages/admin/RestaurantSetup';
import Themes    from './pages/admin/Themes';
import VIPSetup  from './pages/admin/VIPSetup';

// Super-admin (platform) layout & pages
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import KYCQueue from './pages/superadmin/KYCQueue';
import Restaurants from './pages/superadmin/Restaurants';
import SecurityCenter from './pages/superadmin/SecurityCenter';

const STAFF_ROLES = ['manager', 'cashier', 'waiter', 'kitchen', 'driver'];

// ── Silent auth hook ───────────────────────────────────────
// On every page load, if we have a persisted user profile, try to get a
// fresh access token via the httpOnly refresh cookie. This is invisible
// to the user — they stay logged in across hard refreshes.
function useSilentRefresh() {
  const { user, logout } = useAuthStore();
  const [ready, setReady] = useState(!!getAccessToken()); // already logged in this session

  useEffect(() => {
    if (ready) return; // already have a token in memory, nothing to do
    if (!user) { setReady(true); return; } // no persisted user — skip

    authService.refresh()
      .then(r => {
        const token = r?.data?.accessToken;
        if (token) setAccessToken(token);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ready;
}

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  if (user?.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  return <Navigate to="/admin" replace />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function MaintenanceGuard({ children, status }) {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const isSuperAdminZone = pathname.startsWith('/superadmin') || pathname === '/login';
  const isMaintenance    = status?.maintenanceMode && user?.role !== 'superadmin';
  if (isMaintenance && !isSuperAdminZone) {
    return <Maintenance message={status?.message} scheduledUntil={status?.scheduledUntil} />;
  }
  return children;
}

export default function App() {
  const ready = useSilentRefresh();

  const { data: statusData } = useQuery({
    queryKey: ['app-status'],
    queryFn:  () => adminService.getStatus().then(r => r.data),
    refetchInterval: 30_000,
    retry: false,
    staleTime: 10_000,
  });

  // Wait for the silent refresh attempt before rendering protected routes
  // so we don't flash a login redirect while the token is being restored.
  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MaintenanceGuard status={statusData}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* Restaurant public page — standalone */}
          <Route path="/r/:slug" element={<RestaurantPage />} />

          {/* Auth */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-based post-login redirect */}
          <Route path="/dashboard" element={<RoleRedirect />} />

          {/* ── Super-admin (platform) ── */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index              element={<SuperAdminDashboard />} />
            <Route path="kyc-queue"   element={<KYCQueue />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="security"    element={<SecurityCenter />} />
          </Route>

          {/* ── Restaurant OS (owner + staff) ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['owner', ...STAFF_ROLES]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index               element={<Dashboard />} />
            <Route path="pos"          element={<POS />} />
            <Route path="tables"       element={<Tables />} />
            <Route path="kitchen"      element={<Kitchen />} />
            <Route path="menu"         element={<Menu />} />
            <Route path="orders"       element={<Orders />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="staff"        element={<Staff />} />
            <Route path="settings"     element={<Settings />} />
            <Route path="kyc"          element={<KYC />} />
            <Route path="setup"        element={<RestaurantSetup />} />
            <Route path="themes"       element={<Themes />} />
            <Route path="vip-setup"    element={<VIPSetup />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MaintenanceGuard>
    </BrowserRouter>
  );
}
