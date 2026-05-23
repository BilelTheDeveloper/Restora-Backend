import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
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

function RoleRedirect() {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  return <Navigate to="/admin" replace />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

// Blocks the app with the maintenance page when maintenance mode is on,
// except for superadmins and the login/superadmin paths.
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
  const { data: statusData } = useQuery({
    queryKey: ['app-status'],
    queryFn:  () => adminService.getStatus().then(r => r.data),
    refetchInterval: 30_000,
    retry: false,
    staleTime: 10_000,
  });

  const appStatus = statusData;

  return (
    <BrowserRouter>
      <MaintenanceGuard status={appStatus}>
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
            <Route index                  element={<SuperAdminDashboard />} />
            <Route path="kyc-queue"       element={<KYCQueue />} />
            <Route path="restaurants"     element={<Restaurants />} />
            <Route path="security"        element={<SecurityCenter />} />
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
