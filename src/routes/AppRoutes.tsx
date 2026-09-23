import { AdminUIProvider } from '@context/AdminUIContext';
import { ProfileProvider } from '@context/userContext';
import { AccountProvider } from '@context/AccountContext';
import { ApiInterceptor, isJwtExpired } from '@services/apiService';
import { Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { lazyWithRetry } from '@utils/lazyWithRetry';
import AppLoader from '@components/layout/AppLoader';
import ProtectedRoute from '@components/auth/ProtectedRoute';

// Lazy loaded components (retry + one-shot full reload on stale Firebase chunks)
const AdminSettings = lazyWithRetry(() => import('@features/AdminSettings/AdminSettings'));
const Login = lazyWithRetry(() => import('@features/login/Login'));
const MailboxPage = lazyWithRetry(() => import('@features/emails/MailBoxPage'));
const EmailDetailPage = lazyWithRetry(() => import('@features/emails/EmailDetailPage'));
const SettingsPage = lazyWithRetry(() => import('@features/settings/SettingsPage'));
const CalendarPage = lazyWithRetry(() => import('@features/calendar/CalendarPage'));
const ContactsPage = lazyWithRetry(() => import('@features/contacts/ContactsPage'));
const RegisterPage = lazyWithRetry(() => import('@features/register/RegisterPage'));
const ForgotPage = lazyWithRetry(() => import('@features/forgot/ForgotPage'));
const AppLayout = lazyWithRetry(() => import('@components/layout/AppLayout'));
const AdminLogin = lazyWithRetry(() => import('@features/adminLogin/adminLogin'));
const AdminLayout = lazyWithRetry(() => import('@components/layout/adminLayout/AdminLayout'));
const AdminDashboard = lazyWithRetry(() => import('@features/AdminDashboard/AdminDashboard'));

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
    <Suspense fallback={<AppLoader />}>
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
          <Route path="mail/contact" element={<ContactsPage />} />

          {/* Optional: calendar can reuse MailboxPage */}
          <Route path="calendar/:boxName" element={<MailboxPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
