import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactElement;
}

const ADMIN_SESSION_KEY = 'admin-auth';

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const isAuthorized = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch (error) {
      console.error('Unable to read admin session state:', error);
      return false;
    }
  }, []);

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const setAdminAuthorized = () => {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    }
  } catch (error) {
    console.error('Unable to persist admin session state:', error);
  }
};

export const clearAdminAuthorization = () => {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch (error) {
    console.error('Unable to clear admin session state:', error);
  }
};

export default ProtectedAdminRoute;
