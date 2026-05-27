# GUIA DE OPERAÇÃO — RELATÓRIO SEMANAL
# Assessoria de Marketing para Restaurantes
# Tempo estimado por cliente: 8–12 minutos

---

## ANTES DE COMEÇAR

Tenha em mãos:
- [ ] Export do Meta Ads do período (em texto)
- [ ] Dados do sistema de cardápio (em texto)
- [ ] Relatório da semana anterior (para comparativo)

---

## PASSO 1 — ABRIR NOVO CHAT

Acesse claude.ai e abra um novo chat.

---

## PASSO 2 — COLAR O BLOCO DE INÍCIO

Cole exatamente nesta ordem:

```
[CONTEÚDO DO PROMPT_MESTRE.md]

CLIENTE: [Nome] — [Cidade/UF]

HISTÓRICO DISPONÍVEL:
[Cole o relatório da semana anterior em texto]
Se for o primeiro relatório, escreva: "Primeiro período da operação"

SOLICITAÇÃO: relatório semanal

PERÍODO: [XX/XX/AAAA] a [XX/XX/AAAA]

DADOS NOVOS:

=== META ADS ===
[Cole os dados exportados do Meta Ads]

=== SISTEMA DE CARDÁPIO ===
[Cole os dados exportados do sistema]
```

---

## PASSO 3 — AGUARDAR A ANÁLISE

O Claude vai:
1. Analisar os dados por campanha
2. Cruzar com o histórico
3. Identificar tendências
4. Gerar a narrativa estratégica
5. Produzir o PDF visual

---

## PASSO 4 — REVISAR O PDF

Antes de enviar pro cliente, verifique:
- [ ] Nome do cliente correto
- [ ] Período correto
- [ ] Métricas batem com os dados que você exportou
- [ ] Nenhum dado em branco ou zerado sem motivo

---

## PASSO 5 — SALVAR O ARQUIVO

Salve o PDF na pasta do cliente seguindo a nomenclatura:

```
RELATORIO_[SIGLA_CLIENTE]_[AAAAMMDD]_[AAAAMMDD].pdf

Exemplo:
RELATORIO_MDF_PF_20260301_20260311.pdf
```

---

## PASSO 6 — ENVIAR AO CLIENTE

Envie o PDF pelo canal de comunicação do cliente (WhatsApp, e-mail, etc.)
com a mensagem padrão de acompanhamento.

---

## ESTRUTURA DE PASTAS RECOMENDADA

```
📁 ASSESSORIA/
  📁 CLIENTES/
    📁 [NOME_CLIENTE]/
      📁 2026/
        📁 01_JANEIRO/
          📄 RELATORIO_[CLIENTE]_20260101_20260107.pdf
          📄 RELATORIO_[CLIENTE]_20260108_20260114.pdf
          📄 RELATORIO_[CLIENTE]_MENSAL_202601.pdf
        📁 02_FEVEREIRO/
          ...
        📁 03_MARCO/
          📄 RELATORIO_MDF_PF_20260301_20260311.pdf
          ...
      📁 HISTORICO_DADOS/
        📄 dados_fev_2026.txt
        📄 dados_mar_01_11_2026.txt
```

---

## SIGLAS SUGERIDAS POR CLIENTE

| Cliente | Sigla |
|---|---|
| Mestre do Frango — Passo Fundo | MDF_PF |
| [Próximo cliente] | [SIGLA] |

---

## DICAS PARA DADOS DE QUALIDADE

**Do Meta Ads, sempre exporte:**
- Nome exato de cada campanha
- Investimento do período (não acumulado)
- Alcance e impressões do período
- Eventos do cardápio: adições ao carrinho, checkouts, compras
- Valor de conversão rastreado
- Custo por resultado (CPA)

**Do sistema de cardápio, sempre exporte:**
- Período exato (mesma data do Meta)
- Faturamento por canal (delivery/retirada/balcão)
- Número de pedidos por canal
- Novos clientes vs recorrentes
- Cancelamentos

---

*Assessoria de Marketing e Performance para Restaurantes*  
*Kit Interno v1.0 — atualizado em 12/03/2026*
