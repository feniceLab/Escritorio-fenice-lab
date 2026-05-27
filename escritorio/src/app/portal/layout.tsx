// Layout do Portal do Cliente.
// A autenticacao por sessao eh aplicada no middleware (src/middleware.ts).
// /portal/login eh publica; demais rotas /portal/* exigem cookie 'client-portal-session'.
// Mantemos este layout apenas para visual; sem auth aqui evitando loop em /portal/login.

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return <>{children}</>;
}
