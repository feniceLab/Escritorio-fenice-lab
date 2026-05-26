import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/jwt";

export default async function Home() {
  if (process.env.FENIX_EMBEDDED === "true") {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("host") || "localhost:3000";
    const res = await fetch(`${proto}://${host}/api/embed/setup`, {
      cache: "no-store",
    });
    if (res.ok) {
      const { channelId, characterId } = await res.json();
      if (channelId && characterId) {
        redirect(`/game?channelId=${channelId}&characterId=${characterId}`);
      }
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      redirect("/characters");
    }
  }

  redirect("/auth");
}
