import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function PortalLoginPage({ searchParams }: LoginPageProps) {
  const { token, error } = await searchParams;

  if (token) {
    redirect("/api/portal/verify?token=" + token);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-10 bg-white rounded-2xl shadow-sm text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fenix Lab</h1>
          <p className="text-sm text-gray-500 mt-1">Portal do Cliente</p>
        </div>

        {error === "invalid" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            O link de acesso é inválido ou expirou. Solicite um novo link à equipe Fenix Lab.
          </div>
        )}

        <p className="text-gray-600 text-sm">
          Para acessar o portal, utilize o link enviado pela equipe Fenix Lab.
          Os links são válidos por 15 minutos e de uso único.
        </p>

        <p className="text-gray-400 text-xs mt-6">
          Dúvidas? Entre em contato pelo WhatsApp ou e-mail da sua gerente de projetos.
        </p>
      </div>
    </div>
  );
}
