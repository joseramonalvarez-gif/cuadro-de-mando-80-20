import React, { useEffect } from 'react';
import { useApp } from '../shared/DemoContext';
import { Shield } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, isAdmin, isAdvanced } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#33A19A]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = 
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'advanced' && isAdvanced) ||
      (requiredRole === 'user');

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="w-16 h-16 text-[#E05252] mb-4" />
          <h2 className="text-xl font-bold text-[#1B2731] mb-2">Acceso Denegado</h2>
          <p className="text-sm text-[#3E4C59]">No tienes permisos para acceder a esta sección</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}