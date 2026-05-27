/**
 * extract_trello_data.js
 *
 * Extrai TODAS as informações do Trello:
 * - Boards, Listas, Cards
 * - Clientes, Conteúdos, Estrutura
 *
 * Salva em JSON estruturado para criar template Asana
 */

const TRELLO_KEY = '652082e6501f51d8407dcb3e37470ac0';
const TRELLO_TOKEN = '35a16e0d9fca110aad7105922b07acfdef8b08304bc7ee5162e1ce62e837c32a';
const TRELLO_BASE = 'https://api.trello.com/1';

async function fetchTrello(endpoint) {
  const url = `${TRELLO_BASE}${endpoint}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Trello API error: ${res.statusText}`);
  return res.json();
}

async function extractAllData() {
  console.log('🔍 Extraindo dados do Trello...\n');

  const result = {
    extracted_at: new Date().toISOString(),
    boards: [],
    summary: {}
  };

  try {
    // 1. Listar todos os boards
    console.log('📋 Buscando boards...');
    const boards = await fetchTrello('/members/me/boards');
    console.log(`   ✅ ${boards.length} board(s) encontrado(s)\n`);

    for (const board of boards) {
      console.log(`📊 Processando board: "${board.name}"`);

      const boardData = {
        id: board.id,
        name: board.name,
        url: board.url,
        desc: board.desc,
        lists: [],
        stats: {
          total_lists: 0,
          total_cards: 0
        }
      };

      try {
        // 2. Listar listas do board
        const lists = await fetchTrello(`/boards/${board.id}/lists`);
        console.log(`   └─ ${lists.length} lista(s)`);

        for (const list of lists) {
          const listData = {
            id: list.id,
            name: list.name,
            cards: []
          };

          try {
            // 3. Listar cards da lista
            const cards = await fetchTrello(`/lists/${list.id}/cards`);
            console.log(`      └─ ${cards.length} card(s) em "${list.name}"`);

            for (const card of cards) {
              listData.cards.push({
                id: card.id,
                name: card.name,
                desc: card.desc,
                url: card.url,
                labels: card.labels.map(l => l.name),
                due: card.due,
                idMembers: card.idMembers,
              });
            }

            boardData.stats.total_cards += cards.length;
          } catch (e) {
            console.error(`      ❌ Erro ao buscar cards: ${e.message}`);
          }

          boardData.lists.push(listData);
          boardData.stats.total_lists++;
        }

        result.boards.push(boardData);
      } catch (e) {
        console.error(`   ❌ Erro ao processar board: ${e.message}`);
      }

      console.log('');
    }

    // 4. Gerar sumário
    result.summary = {
      total_boards: result.boards.length,
      total_lists: result.boards.reduce((sum, b) => sum + b.stats.total_lists, 0),
      total_cards: result.boards.reduce((sum, b) => sum + b.stats.total_cards, 0),
      boards_by_name: result.boards.map(b => ({
        name: b.name,
        lists: b.stats.total_lists,
        cards: b.stats.total_cards
      }))
    };

    // 5. Salvar em arquivo
    const fs = require('fs');
    const filename = 'trello_extracted_data.json';
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));

    console.log('✅ EXTRAÇÃO CONCLUÍDA!\n');
    console.log(`📊 RESUMO:`);
    console.log(`   Boards: ${result.summary.total_boards}`);
    console.log(`   Listas: ${result.summary.total_lists}`);
    console.log(`   Cards: ${result.summary.total_cards}`);
    console.log(`\n💾 Dados salvos em: ${filename}`);

    return result;
  } catch (e) {
    console.error('❌ Erro fatal:', e.message);
    throw e;
  }
}

// Executar
extractAllData().catch(console.error);
