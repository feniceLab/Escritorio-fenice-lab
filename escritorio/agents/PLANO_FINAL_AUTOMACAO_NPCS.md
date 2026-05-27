# Plano final - NPCs operadores do Starken-OS

## Regra de seguranca

Enquanto o aplicativo atual estiver online, nenhuma tabela existente deve ser alterada de forma destrutiva.
Toda evolucao deve ser aditiva: novas rotas, novas funcoes, novos fluxos, novas tabelas auxiliares ou uso
compativel das tabelas ja existentes.

## Estado ja implementado

- `automation_jobs` existe e permite fila de automacoes.
- `approval_requests` existe e permite aprovacao humana.
- `npc_action_logs` existe e registra auditoria.
- Worker de automacao roda no `server.js`.
- APIs internas de automacao existem.
- Acoes base existem: `create_task`, `create_memory`, `send_alert`.
- Telegram ja conversa com NPCs via `TelegramManager`.
- Memoria operacional existe em `npc_memory_items`.

## Lacunas

- Poucas acoes internas existem.
- Nao ha matriz de permissao por NPC.
- Eventos do Starken-OS ainda nao disparam automacoes de forma consistente.
- Aprovacoes e logs nao tem painel operacional dedicado.
- Alertas ainda ficam apenas registrados em log.
- Nao ha resumo diario automatico.
- Tarefas atrasadas nao sao roteadas automaticamente para Gestao.

## Implementacao aditiva proposta

### Fase 1 - Acoes e permissoes

- Criar catalogo de acoes internas dos NPCs.
- Criar matriz de permissao por area operacional.
- Bloquear acoes sensiveis por aprovacao.
- Expandir executor de automacoes sem alterar tabelas existentes.

### Fase 2 - Eventos operacionais

- Criar avaliador de tarefas atrasadas.
- Criar automacao de resumo diario.
- Criar evento manual seguro para enfileirar automacoes.
- Usar `automation_jobs.payload` como envelope de evento.

### Fase 3 - Painel de supervisao

- Criar tela de operacoes dos NPCs.
- Listar jobs, aprovacao pendente e logs.
- Permitir aprovar/rejeitar solicitacoes.
- Permitir processar fila manualmente.

### Fase 4 - Conectar processos de escritorio

- Reuniao finalizada gera resumo, decisoes e tarefas.
- Conteudo/calendario gera pendencias e alertas.
- Clientes/onboarding geram checklist e follow-up.
- Relatorios geram resumo executivo.

## Pacote inicial implementavel agora

1. Expandir acoes internas:
   - `update_task_status`
   - `assign_task`
   - `create_client_note`
   - `create_meeting_minute`
   - `create_report`
   - `send_telegram_alert`
   - `daily_operations_report`
   - `scan_overdue_tasks`
2. Adicionar permissoes por NPC em codigo.
3. Adicionar endpoints de eventos e painel.
4. Adicionar painel `/admin/npc-operations`.
5. Manter app existente funcionando sem alterar tabelas antigas.
