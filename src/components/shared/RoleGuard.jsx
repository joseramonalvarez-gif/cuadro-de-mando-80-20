import React from 'react';
import { useApp } from './DemoContext';

export default function RoleGuard({ children, roles = [], fallback = null }) {
  const { user, isAdmin, isAdvanced } = useApp();

  if (!user) return fallback;

  const userRole = user.role || 'user';
  
  // Admin has access to everything
  if (isAdmin) return <>{children}</>;
  
  // Check if user's role is in allowed roles
  if (roles.length > 0 && !roles.includes(userRole)) {
    return fallback;
  }

  return <>{children}</>;
}