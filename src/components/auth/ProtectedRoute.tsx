import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiInterceptor, isJwtExpired } from '@services/apiService';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token || isJwtExpired(token)) {
    if (token) {
      ApiInterceptor.clearUserData();
    }
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
