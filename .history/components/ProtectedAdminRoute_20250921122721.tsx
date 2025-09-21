import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminContext } from '../contexts/AdminContext';

interface ProtectedAdminRouteProps {
  children: React.ReactElement;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAdmin, token } = useAdminContext();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Clone the child element and pass the admin token as a prop
  return React.cloneElement(children, { adminToken: token });
};

export default ProtectedAdminRoute;
