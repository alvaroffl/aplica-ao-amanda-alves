import { Outlet } from 'react-router';
import { AuthProvider } from './auth';

/** Rotas que precisam de sessão (login e painel) — carregadas sob demanda. */
export default function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
