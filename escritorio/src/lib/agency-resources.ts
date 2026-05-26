import { eq, and } from "drizzle-orm";
import {
  db,
  skills,
  mcpServers,
  channelSkills,
  channelMcpServers,
  agencyReports,
} from "@/db";

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function listGlobalSkills() {
  return await db.select().from(skills);
}

export async function getChannelSkills(channelId: string) {
  const rows = await db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      instructions: skills.instructions,
    })
    .from(channelSkills)
    .innerJoin(skills, eq(channelSkills.skillId, skills.id))
    .where(eq(channelSkills.channelId, channelId));
  
  return rows;
}

export async function addSkillToChannel(channelId: string, skillId: string) {
  return await db.insert(channelSkills).values({
    channelId,
    skillId,
  }).onConflictDoNothing();
}

export async function removeSkillFromChannel(channelId: string, skillId: string) {
  return await db.delete(channelSkills).where(
    and(
      eq(channelSkills.channelId, channelId),
      eq(channelSkills.skillId, skillId)
    )
  );
}

// ---------------------------------------------------------------------------
// MCP Servers
// ---------------------------------------------------------------------------

export async function listGlobalMcpServers() {
  return await db.select().from(mcpServers);
}

export async function getChannelMcpServers(channelId: string) {
  const rows = await db
    .select({
      id: mcpServers.id,
      name: mcpServers.name,
      description: mcpServers.description,
      command: mcpServers.command,
      args: mcpServers.args,
      envVariables: mcpServers.envVariables,
    })
    .from(channelMcpServers)
    .innerJoin(mcpServers, eq(channelMcpServers.mcpServerId, mcpServers.id))
    .where(eq(channelMcpServers.channelId, channelId));
  
  return rows;
}

export async function addMcpServerToChannel(channelId: string, mcpServerId: string) {
  return await db.insert(channelMcpServers).values({
    channelId,
    mcpServerId,
  }).onConflictDoNothing();
}

export async function removeMcpServerFromChannel(channelId: string, mcpServerId: string) {
  return await db.delete(channelMcpServers).where(
    and(
      eq(channelMcpServers.channelId, channelId),
      eq(channelMcpServers.mcpServerId, mcpServerId)
    )
  );
}

// ---------------------------------------------------------------------------
// Agency Reports
// ---------------------------------------------------------------------------

export async function createAgencyReport(input: {
  channelId: string;
  agentId?: string;
  content: string;
  analysisMode?: string;
}) {
  return await db.insert(agencyReports).values({
    channelId: input.channelId,
    agentId: input.agentId || null,
    content: input.content,
    analysisMode: input.analysisMode || "daily",
  }).returning();
}

export async function listAgencyReports(channelId?: string) {
  if (channelId) {
    return await db.select().from(agencyReports).where(eq(agencyReports.channelId, channelId));
  }
  return await db.select().from(agencyReports);
}
