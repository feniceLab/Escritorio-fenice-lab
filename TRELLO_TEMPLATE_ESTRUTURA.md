# 📋 Template Estrutura Trello → Asana

**Arquivo Original:** `8kSs8AcB - starken-alpha.json`
**Data:** 2026-03-17
**Objetivo:** Usar essa estrutura para provisionar clientes no Asana com as mesmas listas/seções padrão

---

## 🏢 CLIENTES IDENTIFICADOS

### Grupo STARKEN (Tráfego Pago)
1. ✅ ROSA MEXICANO BLUMENAU
2. ✅ ROSA MEXICANO BRUSQUE
3. ✅ MORTADELLA
4. ✅ FEIO HAMBURGUERIA
5. ✅ OCA RESTAURANTE
6. ✅ ACADEMIA SAO PEDRO
7. ✅ MADRUGAO
8. ✅ D BRITOS
9. ✅ PAIAGUAS
10. ✅ WORLD BURGER
11. ✅ SUPREMA PIZZA
12. ✅ SUPER DUPER
13. ✅ FRATELLIS
14. ✅ SAPORITO
15. ✅ MELHOR VISAO
16. ✅ PATRICIA SALGADOS
17. ✅ SALFEST
18. ✅ MESTRE DO FRANGO
19. ✅ PIZZARIA DO NEI

---

## 📋 ESTRUTURA PADRÃO DE LISTAS (Seções no Asana)

Todas os clientes seguem este padrão de listas:

1. **ANDAMENTO DA SEMANA**
   - Cards: Status de entrega semanal

2. **2 FEED SEMANA + 7 STORIES**
   - Cards: Feed Instagram + Stories (2 posts + 7 stories por semana)

3. **ACESSOS**
   - Cards: Credenciais, logins, acessos

4. **LINK DRIVE**
   - Cards: Links para pastas do Google Drive com materiais

5. **LINK APROVAÇÃO DE CRONOGRAMA**
   - Cards: Links para aprovação de cronogramas

6. **LOGO**
   - Cards: Assets de logos/branding

7. **SEMANA XX/XX**
   - Cards: Cronograma da semana específica

---

## 📌 CAMPOS DE CADA CARD (Card Details)

Baseado no JSON extraído, cada card possui:

- **Nome:** Título do card (ex: "LOGO ROSA MEXICANO - VETORIZADA.pdf")
- **Descrição:** Detalhes/notas do card
- **Labels:** Tags (cores para categorização)
- **Membros Atribuídos:** Quem é responsável
- **Data de Vencimento:** Quando deve ser entregue
- **Anexos:** Links/files

---

## 🎯 MAPEAMENTO PARA ASANA

### Estrutura Proposta (3 Projetos por Cliente):

#### **Projeto 1: CONTEÚDO**
Seções idênticas às do Trello:
- ANDAMENTO DA SEMANA
- 2 FEED SEMANA + 7 STORIES
- LOGO
- ACESSOS
- LINK DRIVE
- LINK APROVAÇÃO DE CRONOGRAMA
- SEMANA XX/XX

#### **Projeto 2: TRÁFEGO**
- Campanhas Google Ads
- Campanhas Facebook
- Performance & Conversão
- Cronogramas
- Orçamentos

#### **Projeto 3: CRIATIVOS**
- Design
- Copy
- Roteiros
- Assets

---

## 📊 ESTATÍSTICAS DO BOARD

- **Total de Clientes:** 19
- **Total de Listas:** 7+ (padrão repetido por cliente)
- **Estrutura:** Kanban com status por semana

---

## 🔄 PRÓXIMOS PASSOS

1. ✅ Extrair estrutura do Trello (FEITO)
2. ⏳ Criar template JSON com essa estrutura
3. ⏳ Modificar `api/asana/provision.js` para usar esse template
4. ⏳ Provisionar todos os 19 clientes no Asana
5. ⏳ Testar fluxo completo
6. ⏳ Começar a operar no Asana (migração)

---

## 💾 Arquivo JSON Original

Local: `C:\Users\juanf\OneDrive\Documents\ASSESSORIA\Exportacao Trello\8kSs8AcB - starken-alpha.json`
