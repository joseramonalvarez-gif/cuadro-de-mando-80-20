import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../shared/DemoContext';

export default function ProtectedRoute({ children, requiredRole = 'user' }) {
  const { user, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Verificar rol
  const roleHierarchy = { user: 1, advanced: 2, admin: 3 };
  const userLevel = roleHierarchy[user.role] || 1;
  const requiredLevel = roleHierarchy[requiredRole] || 1;
  
  if (userLevel < requiredLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFAF3]">
        <div className="max-w-md p-8 bg-white rounded-2xl border border-[#E8EEEE] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2731] mb-2 font-['Space_Grotesk']">
            Acceso no autorizado
          </h2>
          <p className="text-sm text-[#3E4C59] mb-4">
            No tienes permisos para acceder a esta sección. Contacta con el administrador si necesitas acceso.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#33A19A] text-white rounded-lg hover:bg-[#2d8a84] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
  
  return children;
}