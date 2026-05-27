const http = require("http");
const crypto = require("crypto");
const { execSync } = require("child_process");

const SECRET = process.env.WEBHOOK_SECRET || "fenix-deploy-2030";
const PORT = 3010;

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  const digest = "sha256=" + hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/deploy") {
    res.writeHead(404);
    return res.end("Not found");
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    const signature = req.headers["x-hub-signature-256"] || "";

    if (!verifySignature(body, signature)) {
      console.log("[webhook] Assinatura inválida — ignorado");
      res.writeHead(401);
      return res.end("Unauthorized");
    }

    let event;
    try { event = JSON.parse(body); } catch { event = {}; }

    const branch = (event.ref || "").replace("refs/heads/", "");
    if (branch !== "main") {
      console.log(`[webhook] Branch ${branch} — ignorado (só main)`);
      res.writeHead(200);
      return res.end("Ignored");
    }

    console.log(`[webhook] Push no main detectado — iniciando deploy`);
    res.writeHead(200);
    res.end("Deploy iniciado");

    try {
      execSync("bash /var/www/fenix-lab/deploy.sh", { stdio: "inherit" });
    } catch (e) {
      console.error("[webhook] Erro no deploy:", e.message);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Servidor rodando na porta ${PORT}`);
  console.log(`[webhook] Endpoint: POST http://localhost:${PORT}/deploy`);
});
