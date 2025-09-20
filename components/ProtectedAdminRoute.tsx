import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminContext } from '../contexts/AdminContext';

interface ProtectedAdminRouteProps {
  children: React.ReactElement;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAdmin } = useAdminContext();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
