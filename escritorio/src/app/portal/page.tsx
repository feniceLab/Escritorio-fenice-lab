import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseClientSessionCookie } from "@/lib/auth/client-portal";
import { db } from "@/db";
import { officeContentPieces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import PortalContentList from "./components/PortalContentList";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("client-portal-session")?.value;

  if (!sessionCookie) redirect("/portal/login");

  const session = parseClientSessionCookie(sessionCookie);
  if (!session) redirect("/portal/login");

  const pieces = await db
    .select({
      id: officeContentPieces.id,
      title: officeContentPieces.title,
      caption: officeContentPieces.caption,
      mediaUrls: officeContentPieces.mediaUrls,
      platform: officeContentPieces.platform,
      status: officeContentPieces.status,
      createdAt: officeContentPieces.createdAt,
    })
    .from(officeContentPieces)
    .where(
      and(
        eq(officeContentPieces.clientId, session.clientId),
        eq(officeContentPieces.status, "review"),
      )
    )
    .orderBy(officeContentPieces.createdAt);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Conteúdos aguardando aprovação</h2>
      {pieces.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhum conteúdo aguardando aprovação no momento.
        </div>
      ) : (
        <PortalContentList pieces={pieces} />
      )}
    </div>
  );
}
