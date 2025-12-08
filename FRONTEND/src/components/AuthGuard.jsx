import React from 'react';
import useAuthStore from '../context/useAuthStore';
import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard = ({ children, requireAuth = true }) => {
  const { authInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
