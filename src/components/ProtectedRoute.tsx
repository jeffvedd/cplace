import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

const isAuthenticated = () => {
  // simple presence check for token — adapt se houver verificação de sessão real
  return !!localStorage.getItem('cplace_token');
};

export const ProtectedRoute = ({ children }: Props) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};
