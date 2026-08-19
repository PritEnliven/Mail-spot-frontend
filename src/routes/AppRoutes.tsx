import { AdminUIProvider } from '@context/AdminUIContext';
import { ProfileProvider } from '@context/userContext';
import { AccountProvider } from '@context/AccountContext';
import { ApiInterceptor, isJwtExpired } from '@services/apiService';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

// Lazy loaded components
const AdminSettings = lazy(() => import('@features/AdminSettings/AdminSettings'));
const Login = lazy(() => import('@features/login/Login'));
const MailboxPage = lazy(() => import('@features/emails/MailBoxPage'));
const EmailDetailPage = lazy(() => import('@features/emails/EmailDetailPage'));
const SettingsPage = lazy(() => import('@features/settings/SettingsPage'));
const CalendarPage = lazy(() => import('@features/calendar/CalendarPage'));
const RegisterPage = lazy(() => import('@features/register/RegisterPage'));
const ForgotPage = lazy(() => import('@features/forgot/ForgotPage'));
const AppLayout = lazy(() => import('@components/layout/AppLayout'));
const ProtectedRoute = lazy(() => import('@components/auth/ProtectedRoute'));
const AdminLogin = lazy(() => import('@features/adminLogin/adminLogin'));
const AdminLayout = lazy(() => import('@components/layout/adminLayout/AdminLayout'));
const AdminDashboard = lazy(() => import('@features/AdminDashboard/AdminDashboard'));

// Admin protected route component
const AdminProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  if (!token || isJwtExpired(token)) {
    if (token) {
      ApiInterceptor.clearAdminData();
    }
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={null}>
      <Routes>

        {/* public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={
          <AdminUIProvider>
            <AdminProtectedRoute />
          </AdminUIProvider>
        }>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* User protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AccountProvider>
              <ProfileProvider>
                <AppLayout />
              </ProfileProvider>
            </AccountProvider>
          </ProtectedRoute>
        }>
          {/* Default redirect */}
          <Route index element={<Navigate to="/mail/INBOX" replace />} />

          {/* Mailbox routes */}
          <Route path="mail/:boxName" element={<MailboxPage />}>
            <Route path=":emailId" element={<EmailDetailPage />} />
          </Route>

          {/* Settings route */}
          <Route path="mail/settings" element={<SettingsPage />} />
          <Route path="mail/calendar" element={<CalendarPage />} />

          {/* Optional: calendar can reuse MailboxPage */}
          <Route path="calendar/:boxName" element={<MailboxPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
