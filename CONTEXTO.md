# CONTEXTO DO PROJETO - Starken & Alpha Assessoria

> Leia este arquivo ao iniciar uma nova sessão para retomar o trabalho exatamente de onde parou.

---

## 1. QUEM É O USUÁRIO

**Juan** - Gestor de tráfego pago
- Trabalha com 2 empresas: **Starken Performance** (25 clientes) e **Alpha Assessoria** (10 clientes)
- Total: 35 clientes, maioria do segmento de Gastronomia

---

## 2. EQUIPE

| Nome | Cargo | PIN | Cor |
|------|-------|-----|-----|
| Juan | Gestor / Admin | 1234 | Azul |
| Henrique | Designer | 5678 | Roxo |
| Emilly | Criadora de Conteúdo | 2222 | Amarelo |

> Bruna e Marina existem no banco mas NÃO têm login no sistema.

---

## 3. STACK TÉCNICA

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| Frontend | HTML/CSS/JS puro (SPA) | Arquivo único: `gestao-projetos.html` |
| Banco de Dados | Supabase (PostgreSQL) | Credenciais na seção 5 do HANDOFF_PRD.md |
| API Backend | Vercel Serverless | Pasta `/api` |
| Repositório | GitHub | https://github.com/ferramentastecnologia/starken-performance |
| Deploy | Vercel | Conectado ao GitHub |

---

## 4. ARQUIVOS PRINCIPAIS

```
ASSESSORIA/
├── gestao-projetos.html          ← SISTEMA PRINCIPAL (novo)
├── checklist-relatorios.html     ← Sistema antigo de relatórios (manter)
├── SQL_GESTAO_PROJETOS_v2.sql    ← Schema do banco (já executado no Supabase)
├── PRD_GESTAO_PROJETOS.md        ← Documentação completa do sistema
├── HANDOFF_PRD.md                ← Credenciais na seção 5
├── CONTEXTO.md                   ← Este arquivo
└── api/
    └── asana/
        └── provision.js          ← API Vercel
```

---

## 5. CREDENCIAIS

> Estão na **seção 5 do HANDOFF_PRD.md** - não pedir ao usuário.
> Variáveis de ambiente configuradas no Vercel Dashboard.

---

## 6. BANCO DE DADOS (SUPABASE)

### Tabelas criadas (SQL_GESTAO_PROJETOS_v2.sql já executado):
- `users` - 3 usuários (Juan, Henrique, Emilly)
- `spaces` - 2 spaces (Starken, Alpha)
- `projects` - 8 projetos (4 por space)
- `sections` - 18 seções (colunas do kanban)
- `clients_v2` - 35 clientes
- `tasks` - tarefas (vazia, populada pelo sistema)
- `schedules` + `schedule_items` - cronogramas
- `reports` - relatórios
- `activity_log` - log de ações

> ⚠️ O frontend ainda usa `localStorage`. Próximo passo é conectar ao Supabase.

---

## 7. SISTEMA ATUAL (gestao-projetos.html)

### O que já funciona:
- ✅ Login com 3 usuários (Juan, Henrique, Emilly)
- ✅ Sidebar com Spaces (Starken/Alpha)
- ✅ Área **Conteúdo & Design**:
  - Vista **Lista** (principal, estilo ClickUp) agrupada por status
  - Vista **Kanban** (quadro)
  - Vista **Calendário** por data de postagem
  - Filtros: cliente, responsável, semana, busca
  - CRUD de tarefas com modal completo
  - Subtarefas expansíveis
- ✅ Todos os 33 clientes com pacote (2feed ou 1feed/tráfego)
- ⏳ Hub dos Clientes (placeholder)
- ⏳ Cronogramas (placeholder)
- ⏳ Relatórios (placeholder)
- ⏳ Dashboard (placeholder)

---

## 8. ESTRUTURA DE STATUS (Conteúdo & Design)

```
ACTIVE:
A FAZER → CRIAÇÃO DE CONTEÚDO → COPY → DESIGN → APROVAÇÃO DESIGN
→ ALTERAÇÃO DESIGN → APROVAÇÃO CLIENTE → ALTERAÇÃO → REVISÃO
→ AGENDAR → AGENDADO → POSTADO

DONE:
PLANO DE MÍDIA | AGUARDANDO INFORMAÇÕES | STAND-BY

CLOSED:
FINALIZADO
```

---

## 9. CLIENTES POR SPACE

### STARKEN (25 clientes)

**Gastronomia - 2 FEED/semana:**
Mortadella Blumenau, Hamburgueria Feio, Rosa Mexicano Blumenau,
Rosa Mexicano Brusque, Suprema Pizza, Madrugao Centro/Garcia/Fortaleza,
Restaurante Oca, Aseyori Restaurante

**Gastronomia - 1 FEED+TRÁFEGO/semana:**
Arena Gourmet, Super X Garuva/Guaratuba/Itapoa,
Oklahoma Burger, Pizzaria Super X, Sr Salsicha

**Outros segmentos - 2 FEED/semana:**
The Garrison (Eventos), Academia Sao Pedro (Academia), JPR Moveis Rusticos

**Outros segmentos - 1 FEED+TRÁFEGO/semana:**
Estilo Tulipa, New Service, Melhor Visao

**Apenas gestão (sem conteúdo):**
Bengers, Dommus Smart Home

### ALPHA (10 clientes)

**2 FEED/semana:**
Super Duper, WorldBurguer, Saporito Pizzaria, Fratellis Pizzaria

**1 FEED+TRÁFEGO/semana:**
Mestre do Frango, Patricia Salgados, Pizzaria do Nei,
Sorveteria Maciel, Salfest, D'Britos

---

## 10. O QUE FAZER A SEGUIR (prioridade)

1. **Conectar Supabase** - substituir localStorage pelas APIs do Supabase
2. **Hub dos Clientes** - página com infos de cada cliente (acessos, drive, logo, contrato, andamento)
3. **Cronogramas** - planejamento semanal por cliente com calendário
4. **Relatórios** - integrar o checklist-relatorios.html existente
5. **Dashboard** - métricas gerais (tarefas por status, carga por responsável, alertas)

---

## 11. CONTEXTO DE NEGÓCIO

- O sistema substitui o uso do **Trello** (legado) e **Asana** (em transição)
- Trello tinha 347 cards, 31 listas, 29 clientes cadastrados
- 6 clientes estão apenas no sistema novo (não estavam no Trello)
- O Asana tem 4 projetos globais criados:
  - Starken | Conteudo & Design (GID: 1213723818294003)
  - Alpha | Conteudo & Design (GID: 1213723818608395)
  - Starken | Hub dos Clientes (GID: 1213723134141124)
  - Alpha | Hub dos Clientes (GID: 1213723818393248)

---

## 12. COMO RETOMAR EM OUTRO COMPUTADOR

```bash
# 1. Clonar o repositório
git clone https://github.com/ferramentastecnologia/starken-performance.git

# 2. Abrir Claude Code na pasta
cd starken-performance
claude

# 3. Dizer ao Claude:
# "Leia o CONTEXTO.md e continue o desenvolvimento do sistema"
```

---

*Última atualização: 2026-03-17*
