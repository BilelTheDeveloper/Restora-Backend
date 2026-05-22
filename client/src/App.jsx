import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public layouts & pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/public/Home';
import RestaurantPage from './pages/public/RestaurantPage';

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
import Themes from './pages/admin/Themes';

// Super-admin (platform) layout & pages
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import KYCQueue from './pages/superadmin/KYCQueue';
import Restaurants from './pages/superadmin/Restaurants';

const STAFF_ROLES = ['manager', 'cashier', 'waiter', 'kitchen', 'driver'];

// Redirects to the correct landing page based on role after login
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Restaurant public page — standalone, no shared nav/footer */}
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
          <Route index                element={<SuperAdminDashboard />} />
          <Route path="kyc-queue"     element={<KYCQueue />} />
          <Route path="restaurants"   element={<Restaurants />} />
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
          <Route index              element={<Dashboard />} />
          <Route path="pos"         element={<POS />} />
          <Route path="tables"      element={<Tables />} />
          <Route path="kitchen"     element={<Kitchen />} />
          <Route path="menu"        element={<Menu />} />
          <Route path="orders"      element={<Orders />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="staff"       element={<Staff />} />
          <Route path="settings"    element={<Settings />} />
          <Route path="kyc"         element={<KYC />} />
          <Route path="setup"       element={<RestaurantSetup />} />
          <Route path="themes"      element={<Themes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
