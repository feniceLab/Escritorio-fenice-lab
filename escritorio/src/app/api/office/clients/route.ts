import { NextResponse } from "next/server";
import { listOfficeClients, syncOfficeClients } from "@/lib/office/office-service";

export async function GET() {
  try {
    await syncOfficeClients();
    return NextResponse.json({ clients: await listOfficeClients() });
  } catch (error) {
    console.error("Failed to load office clients:", error);
    return NextResponse.json({ error: "failed_to_load_office_clients" }, { status: 500 });
  }
}
