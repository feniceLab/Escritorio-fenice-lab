# Plano de Implementação — Fase 2: Provisionamento Zero-Touch

**Status:** Fase 1 ✅ Concluída | Fase 2 🚀 Em Andamento
**Data:** 2026-03-17
**Objetivo:** Botão "Provisionar Cliente" que cria automaticamente 3 projetos no Asana + setup completo

---

## 📋 Etapas de Implementação

### **ETAPA 1: Tabelas SQL no Supabase** (30 min)

#### 1.1 Tabela: `clients`
Armazena informações de clientes provisionados.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  asana_workspace_gid TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_clients_email ON clients(email);
```

#### 1.2 Tabela: `asana_config` (já existe, confirmar estrutura)
Armazena configuração de Asana por cliente.

```sql
CREATE TABLE IF NOT EXISTS asana_config (
  id TEXT PRIMARY KEY,
  workspace_gid TEXT,
  default_assignee_gid TEXT,
  default_project_gid TEXT,
  client_project_map JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 1.3 Tabela: `asana_projects`
Rastreia projetos criados para cada cliente.

```sql
CREATE TABLE asana_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_gid TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT, -- 'conteudo' | 'trafego' | 'criativos'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_asana_projects_client ON asana_projects(client_id);
```

#### 1.4 Tabela: `asana_custom_fields`
Armazena custom fields por projeto.

```sql
CREATE TABLE asana_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_gid TEXT NOT NULL,
  field_gid TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT, -- 'text' | 'number' | 'enum' | 'date'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_asana_custom_fields_project ON asana_custom_fields(project_gid);
```

#### 1.5 Execução SQL
Copie e cole no Console Supabase:

**Passo 1:** Vá para https://app.supabase.com → Seu Projeto
**Passo 2:** SQL Editor → Novo Query
**Passo 3:** Cole cada CREATE TABLE acima
**Passo 4:** Run

---

### **ETAPA 2: Implementar api/asana/provision.js** (45 min)

#### 2.1 Lógica Principal

```javascript
/**
 * /api/asana/provision.js — Provisiona cliente novo
 *
 * POST {
 *   "client_name": "Acme Corp",
 *   "client_email": "admin@acme.com",
 *   "workspace_gid": "xxx"
 * }
 *
 * Retorna:
 * {
 *   "ok": true,
 *   "client_id": "uuid",
 *   "projects": {
 *     "conteudo": { "gid": "xxx", "name": "Conteúdo" },
 *     "trafego": { "gid": "yyy", "name": "Tráfego" },
 *     "criativos": { "gid": "zzz", "name": "Criativos" }
 *   }
 * }
 */
```

#### 2.2 Passos da Provisionamento

1. **Validação** — Nome cliente, email, workspace válido
2. **Criar Cliente no Supabase** — Inserir em tabela `clients`
3. **Criar 3 Projetos no Asana:**
   - Projeto "CONTEÚDO" (seções: Blog, Vídeos, Podcasts, Infográficos)
   - Projeto "TRÁFEGO" (seções: Google Ads, Facebook Ads, LinkedIn, Pinterest)
   - Projeto "CRIATIVOS" (seções: Design, Copy, Roteiros, Assets)
4. **Criar Custom Fields em cada projeto:**
   - "Status da Entrega" (Planejado, Em Andamento, Pronto)
   - "Deadline" (date field)
   - "Responsável" (text field)
5. **Salvar Mapeamento** — Guardar GIDs dos projetos no Supabase
6. **Retornar Resposta** — Client ID + 3 Project GIDs

#### 2.3 Estrutura do Código

```
/api/asana/provision.js
├── 1. CORS headers
├── 2. Validação de entrada
├── 3. Criar cliente no Supabase
├── 4. Chamar helper: createProjectWithSections()
│   ├── 4a. Criar projeto no Asana
│   ├── 4b. Criar seções padrão
│   └── 4c. Criar custom fields
├── 5. Guardar GIDs no Supabase (asana_projects)
└── 6. Retornar sucesso
```

---

### **ETAPA 3: Botão na UI** (20 min)

#### 3.1 Adicionar à `checklist-relatorios.html`

**Localizar:** Seção de "Modal de Configuração"
**Adicionar:**

```html
<div class="modal-section">
  <h3>Provisionar Novo Cliente</h3>
  <p>Cria automaticamente 3 projetos no Asana (Conteúdo, Tráfego, Criativos)</p>

  <input type="text" id="newClientName" placeholder="Nome do cliente" />
  <input type="email" id="newClientEmail" placeholder="Email do cliente" />

  <button onclick="provisionarCliente()" class="btn-primary">
    Provisionar Cliente
  </button>
</div>
```

#### 3.2 JavaScript (adicionar ao final do HTML)

```javascript
async function provisionarCliente() {
  const name = document.getElementById('newClientName').value;
  const email = document.getElementById('newClientEmail').value;

  if (!name || !email) {
    alert('Preenchea nome e email');
    return;
  }

  try {
    const res = await fetch('/api/asana/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: name,
        client_email: email,
        workspace_gid: currentWorkspaceGid // pegar do config
      })
    });

    if (res.ok) {
      const data = await res.json();
      alert(`✅ Cliente provisionado! 3 projetos criados.`);
      console.log('Projects created:', data.projects);
      // Limpar inputs
      document.getElementById('newClientName').value = '';
      document.getElementById('newClientEmail').value = '';
    } else {
      alert('❌ Erro ao provisionar');
    }
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}
```

---

### **ETAPA 4: Environment Variables no Vercel**

#### 4.1 Adicionar ao Vercel Dashboard

**URL:** https://vercel.com/dashboard → Seu Projeto → Settings → Environment Variables

**Adicionar estas 4 variáveis:**

| Nome | Valor | Notas |
|---|---|---|
| `ASANA_PAT` | 2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549 | Ver HANDOFF_PRD.md seção 5 |
| `TRELLO_KEY` | 652082e6501f51d8407dcb3e37470ac0 | Ver HANDOFF_PRD.md seção 5 |
| `TRELLO_TOKEN` | 35a16e0d9fca110aad7105922b07acfdef8b08304bc7ee5162e1ce62e837c32a | Ver HANDOFF_PRD.md seção 5 |
| `SUPABASE_SERVICE_KEY` | sbp_2304e595ec570665a5b5ad16c8f97f88699a30fc | Ver HANDOFF_PRD.md seção 5 |

**Além disso, adicione:**

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | https://seu-projeto.supabase.co (pega na sua dashboard Supabase) |

---

## 📊 Checklist de Implementação

- [ ] **Etapa 1:** Executar SQL no Supabase (4 tabelas criadas)
- [ ] **Etapa 2:** Implementar `api/asana/provision.js`
- [ ] **Etapa 3:** Adicionar botão + JavaScript na UI
- [ ] **Etapa 4:** Configurar Environment Variables no Vercel
- [ ] **Teste 1:** Chamar `/api/asana/provision` com POST de teste
- [ ] **Teste 2:** Verificar se cliente foi criado no Supabase
- [ ] **Teste 3:** Verificar se 3 projetos foram criados no Asana
- [ ] **Teste 4:** Clicar botão na UI e provisionar cliente completo

---

## 🔧 Helpers Úteis

### `createProjectWithSections(workspaceGid, projectName, sections)`

Cria um projeto + seções padrão no Asana.

```javascript
async function createProjectWithSections(workspaceGid, projectName, sections) {
  // 1. Criar projeto
  const projRes = await fetch(`https://app.asana.com/api/1.0/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ASANA_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        name: projectName,
        workspace: workspaceGid,
        color: 'light-green' // ou outro
      }
    })
  });

  const proj = await projRes.json();
  const projectGid = proj.data.gid;

  // 2. Criar seções
  for (const sectionName of sections) {
    await fetch(`https://app.asana.com/api/1.0/projects/${projectGid}/sections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASANA_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { name: sectionName }
      })
    });
  }

  return projectGid;
}
```

---

## 📝 Fase 3 (Futura): Webhooks

Depois de Fase 2, implementar:
- Webhook para hand-off automático (Asana → Supabase)
- Notificações em tempo real
- Relatórios automáticos

---

## 🎯 Prioridade de Execução

**1º Lugar:** Etapa 1 (SQL) — bloqueante
**2º Lugar:** Etapa 2 (API) — core functionality
**3º Lugar:** Etapa 3 (UI) — user-facing
**4º Lugar:** Etapa 4 (Vercel) — deploy

---

**Próximo passo:** Confirmar se quer começar agora pela Etapa 1 (SQL)?
