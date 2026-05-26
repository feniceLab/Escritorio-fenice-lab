const fs = require("node:fs");
const path = require("node:path");

const STORE_DIRNAME = ".deskrpg-cli-agents";
const DEFAULT_AGENT_FILES = ["IDENTITY.md", "SOUL.md", "AGENTS.md"];

function resolveWorkspacePath(workspacePath) {
  return path.resolve(/* turbopackIgnore: true */ workspacePath || process.cwd());
}

function getStoreRoot(workspacePath) {
  return path.join(resolveWorkspacePath(workspacePath), STORE_DIRNAME);
}

function sanitizeAgentId(agentId) {
  return String(agentId || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function getAgentDir(workspacePath, agentId) {
  const sanitized = sanitizeAgentId(agentId);
  if (!sanitized) {
    throw new Error("Agent id is required");
  }
  return path.join(getStoreRoot(workspacePath), sanitized);
}

function getMetadataPath(workspacePath, agentId) {
  return path.join(getAgentDir(workspacePath, agentId), "metadata.json");
}

function readMetadata(workspacePath, agentId) {
  const metadataPath = getMetadataPath(workspacePath, agentId);
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch {
    return null;
  }
}

function writeMetadata(workspacePath, agentId, metadata) {
  const agentDir = getAgentDir(workspacePath, agentId);
  ensureDir(agentDir);
  const metadataPath = path.join(agentDir, "metadata.json");
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return metadata;
}

function createAgent(workspacePath, name, workspace) {
  const agentId = sanitizeAgentId(name);
  if (!agentId) {
    throw new Error("Agent name is required");
  }

  const existing = readMetadata(workspacePath, agentId);
  if (existing) {
    return existing;
  }

  const metadata = {
    id: agentId,
    name: String(name || agentId).trim() || agentId,
    workspace: workspace || resolveWorkspacePath(workspacePath),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return writeMetadata(workspacePath, agentId, metadata);
}

function listAgents(workspacePath) {
  const storeRoot = getStoreRoot(workspacePath);
  if (!fs.existsSync(storeRoot)) return [];

  return fs.readdirSync(storeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readMetadata(workspacePath, entry.name))
    .filter(Boolean)
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
}

function deleteAgent(workspacePath, agentId, deleteFiles = false) {
  const agentDir = getAgentDir(workspacePath, agentId);
  if (!fs.existsSync(agentDir)) {
    return { ok: true, deleted: false };
  }

  const metadataPath = path.join(agentDir, "metadata.json");
  if (deleteFiles) {
    fs.rmSync(agentDir, { recursive: true, force: true });
    return { ok: true, deleted: true };
  }

  const files = fs.readdirSync(agentDir).filter((name) => name !== "metadata.json");
  for (const file of files) {
    fs.rmSync(path.join(agentDir, file), { force: true });
  }
  if (fs.existsSync(metadataPath)) {
    const metadata = readMetadata(workspacePath, agentId) || { id: agentId, name: agentId };
    writeMetadata(workspacePath, agentId, {
      ...metadata,
      updatedAt: new Date().toISOString(),
    });
  }
  return { ok: true, deleted: true };
}

function writeAgentFile(workspacePath, agentId, name, content) {
  const metadata = readMetadata(workspacePath, agentId) || createAgent(workspacePath, agentId);
  const filePath = path.join(getAgentDir(workspacePath, agentId), name);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, String(content ?? ""), "utf8");
  writeMetadata(workspacePath, agentId, {
    ...metadata,
    updatedAt: new Date().toISOString(),
  });
  return {
    ok: true,
    agentId: sanitizeAgentId(agentId),
    name,
    content: String(content ?? ""),
  };
}

function readAgentFile(workspacePath, agentId, name) {
  const filePath = path.join(getAgentDir(workspacePath, agentId), name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Agent file not found: ${name}`);
  }
  return {
    ok: true,
    agentId: sanitizeAgentId(agentId),
    name,
    content: fs.readFileSync(filePath, "utf8"),
  };
}

function listAgentFiles(workspacePath, agentId) {
  const agentDir = getAgentDir(workspacePath, agentId);
  if (!fs.existsSync(agentDir)) return [];
  return fs.readdirSync(agentDir)
    .filter((name) => name !== "metadata.json")
    .sort();
}

function buildAgentPrompt(workspacePath, agentId) {
  const files = listAgentFiles(workspacePath, agentId);
  const preferredFiles = [
    ...DEFAULT_AGENT_FILES.filter((name) => files.includes(name)),
    ...files.filter((name) => !DEFAULT_AGENT_FILES.includes(name)),
  ];

  const sections = preferredFiles.map((name) => {
    const { content } = readAgentFile(workspacePath, agentId, name);
    return content.trim() ? `# ${name}\n\n${content.trim()}` : "";
  }).filter(Boolean);

  return sections.join("\n\n");
}

module.exports = {
  DEFAULT_AGENT_FILES,
  buildAgentPrompt,
  createAgent,
  deleteAgent,
  listAgentFiles,
  listAgents,
  readAgentFile,
  resolveWorkspacePath,
  sanitizeAgentId,
  writeAgentFile,
};
