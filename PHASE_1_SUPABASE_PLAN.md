# Phase 1: Supabase Integration - Plano Detalhado

**Status:** Pronto para Execução
**Tempo Estimado:** 2-3h
**Objetivo:** Conectar `gestao-projetos.html` ao Supabase e eliminar localStorage

---

## 1. Análise do Estado Atual

### localStorage (ATUAL - desconetar)
```javascript
// Dados armazenados localmente no navegador
localStorage.getItem('users')
localStorage.getItem('projects')
localStorage.getItem('tasks')
localStorage.getItem('clients_v2')
```

### Supabase (NOVO - conectar)
```
Database: Supabase PostgreSQL
Service Key: sbp_2304e595ec570665a5b5ad16c8f97f88699a30fc
Tables existentes:
- users (3 registros: Juan, Henrique, Emilly)
- spaces (2: Starken, Alpha)
- projects (8: 4 por space)
- sections (18: colunas do kanban)
- clients_v2 (35 clientes)
- tasks (vazia - será populada)
- schedules + schedule_items
- reports
- activity_log
```

---

## 2. Tarefas Específicas (em ordem)

### Task 2.1: Criar Cliente Supabase no Frontend
**Arquivo:** `gestao-projetos.html` (linha ~50, antes do `</head>`)

```javascript
// Importar Supabase Client (CDN)
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<script>
// Inicializar cliente
const SUPABASE_URL = 'https://prcoyppfmvvvkzffmuzx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // anon key do Supabase

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
</script>
```

**Notas:**
- Anon key (não service key - essa é só backend)
- Salvar em variável global `window.supabase`

---

### Task 2.2: Substituir `loadUsers()`
**Arquivo:** `gestao-projetos.html` (função `loadUsers`)

**ANTES (localStorage):**
```javascript
function loadUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]')
}
```

**DEPOIS (Supabase):**
```javascript
async function loadUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) console.error('Erro ao carregar usuários:', error)
  return data || []
}
```

---

### Task 2.3: Substituir `loadProjects()`
**Arquivo:** `gestao-projetos.html`

**ANTES:**
```javascript
function loadProjects() {
  return JSON.parse(localStorage.getItem('projects') || '[]')
}
```

**DEPOIS:**
```javascript
async function loadProjects(spaceId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('space_id', spaceId)

  if (error) console.error('Erro ao carregar projetos:', error)
  return data || []
}
```

---

### Task 2.4: Substituir `loadTasks()`
**Arquivo:** `gestao-projetos.html`

**ANTES:**
```javascript
function loadTasks(projectId) {
  return JSON.parse(localStorage.getItem('tasks') || '[]')
    .filter(t => t.project_id === projectId)
}
```

**DEPOIS:**
```javascript
async function loadTasks(projectId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)

  if (error) console.error('Erro ao carregar tarefas:', error)
  return data || []
}
```

---

### Task 2.5: Substituir `loadClients()`
**Arquivo:** `gestao-projetos.html`

**ANTES:**
```javascript
function loadClients() {
  return JSON.parse(localStorage.getItem('clients_v2') || '[]')
}
```

**DEPOIS:**
```javascript
async function loadClients() {
  const { data, error } = await supabase
    .from('clients_v2')
    .select('*')

  if (error) console.error('Erro ao carregar clientes:', error)
  return data || []
}
```

---

### Task 2.6: Implementar CREATE Task
**Arquivo:** `gestao-projetos.html` (função de criar tarefa)

```javascript
async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      project_id: task.project_id,
      title: task.title,
      description: task.description,
      client_id: task.client_id,
      responsible_id: task.responsible_id,
      status: task.status || 'A FAZER',
      due_date: task.due_date,
      created_at: new Date().toISOString()
    }])
    .select()

  if (error) console.error('Erro ao criar tarefa:', error)
  return data ? data[0] : null
}
```

---

### Task 2.7: Implementar UPDATE Task
**Arquivo:** `gestao-projetos.html`

```javascript
async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()

  if (error) console.error('Erro ao atualizar tarefa:', error)
  return data ? data[0] : null
}
```

---

### Task 2.8: Implementar DELETE Task
**Arquivo:** `gestao-projetos.html`

```javascript
async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) console.error('Erro ao deletar tarefa:', error)
  return !error
}
```

---

### Task 2.9: Converter Chamadas para async/await
**Arquivo:** `gestao-projetos.html`

Todos os lugares que chamam `loadUsers()`, `loadProjects()`, `loadTasks()`, etc precisam virar async:

**ANTES:**
```javascript
function initApp() {
  const users = loadUsers()
  const projects = loadProjects(spaceId)
  renderUI(users, projects)
}
```

**DEPOIS:**
```javascript
async function initApp() {
  const users = await loadUsers()
  const projects = await loadProjects(spaceId)
  renderUI(users, projects)
}
```

---

### Task 2.10: Conectar Modal de Nova Tarefa
**Arquivo:** `gestao-projetos.html` (evento do botão "Nova Tarefa")

```javascript
// Quando formulário for submitted:
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const newTask = {
    project_id: currentProjectId,
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    client_id: document.getElementById('taskClient').value,
    responsible_id: document.getElementById('taskResponsible').value,
    due_date: document.getElementById('taskDueDate').value,
    status: 'A FAZER'
  }

  await createTask(newTask)
  await reloadTasks() // Recarregar lista
  closeModal()
})
```

---

### Task 2.11: Implementar Real-time Subscription (Opcional mas Recomendado)
**Arquivo:** `gestao-projetos.html` (inicialização)

```javascript
// Escutar mudanças em tempo real
supabase
  .channel('tasks')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      console.log('Tarefa alterada:', payload)
      reloadTasks() // Recarregar automaticamente
    }
  )
  .subscribe()
```

---

### Task 2.12: Testar Integração
**Arquivo:** Console do navegador

```javascript
// 1. Testar conexão
const { data } = await supabase.from('users').select('*')
console.log('Usuários:', data)

// 2. Testar criar tarefa
const newTask = await createTask({
  project_id: 1,
  title: 'Test Task',
  status: 'A FAZER'
})
console.log('Nova tarefa:', newTask)

// 3. Testar atualizar
await updateTask(newTask.id, { status: 'POSTADO' })

// 4. Testar deletar
await deleteTask(newTask.id)
```

---

## 3. Informações Necessárias do Supabase

**Solicitar ao Juan:**
- URL do Supabase: `https://prcoyppfmvvvkzffmuzx.supabase.co`
- Anon Key (pública, safe to commit): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Verificar se as tabelas existem via SQL Editor do Supabase

---

## 4. Checklist de Execução

- [ ] Importar Supabase Client CDN
- [ ] Criar `loadUsers()` async
- [ ] Criar `loadProjects()` async
- [ ] Criar `loadTasks()` async
- [ ] Criar `loadClients()` async
- [ ] Implementar `createTask()`
- [ ] Implementar `updateTask()`
- [ ] Implementar `deleteTask()`
- [ ] Converter todas as chamadas para async
- [ ] Testar CRUD no console
- [ ] Testar real-time subscriptions
- [ ] Remover localStorage completamente
- [ ] Commit no GitHub

---

## 5. Próximos Passos Após Phase 1

1. **Phase 2:** Hub dos Clientes (queries agrupadas por cliente)
2. **Phase 3:** Cronogramas (calendário integrado)
3. **Phase 4:** Integrar checklist-relatorios.html
4. **Phase 5:** Dashboard com métricas

---

*Plano criado: 2026-03-18*
