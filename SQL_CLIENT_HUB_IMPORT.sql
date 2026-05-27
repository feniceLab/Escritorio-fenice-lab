-- ================================================================
-- CLIENT HUB IMPORT - generated from Trello export
-- Source: 8kSs8AcB - starken-alpha.json
-- Run with: psql -U postgres -d starken -f SQL_CLIENT_HUB_IMPORT.sql
-- ================================================================

-- Rosa Mexicano Blumenau (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'rosa-mexicano-blumenau',
    'Rosa Mexicano Blumenau',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED SEMANA + 7 STORIES',
    'https://www.rosamexicano.com.br/blumenau',
    'https://drive.google.com/drive/folders/1-7jYI1zLL0QUhiPEkTmTqQUFT2DWPZgt',
    'https://www.canva.com/design/DAG-aBTm_3Q/bZmjKcK6pAvL65ZOWRBcLg/edit?utm_content=DAG-aBTm_3Q&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0cc/attachments/69b9c7abed3b1e981a1acd37/download/LOGO_ROSA_MEXICANO_-_VETORIZADA.pdf',
    '{"instagram": "https://www.instagram.com/rosamexicanoblumenau/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Rosa Mexicano Brusque (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'rosa-mexicano-brusque',
    'Rosa Mexicano Brusque',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED SEMANA + 7 STORIES',
    'https://www.rosamexicano.com.br/brusque',
    'https://drive.google.com/drive/folders/1e9Dro9lkAHjqjS3i8FLJWXIHgYutnbwE',
    'https://www.canva.com/design/DAG-aBTm_3Q/bZmjKcK6pAvL65ZOWRBcLg/edit?utm_content=DAG-aBTm_3Q&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0c6/attachments/69b9c7abed3b1e981a1acd35/download/LOGO_ROSA_MEXICANO_-_VETORIZADA.pdf',
    '{"instagram": "https://www.instagram.com/rosamexicanobrusque/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Mortadella (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'mortadella',
    'Mortadella',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED SEMANA + 7 STORIES',
    'https://cardapio.mortadella.com.br/',
    'https://drive.google.com/drive/folders/1LW3wyL1WckEuK08cbVlGHRHCamN2Rucd',
    'https://www.canva.com/design/DAG76nP9cCE/M5tIUa5bY0clGqipTawmYQ/edit?utm_content=DAG76nP9cCE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0ba/attachments/69b9c7abed3b1e981a1acd2f/download/LOGOTIPO_MORTADELLA.pdf',
    '{"instagram": "https://www.instagram.com/mortadellaristorante/"}'::jsonb,
    '## IDEIAS DE POSTAGENS
## 📸 Ideias para o Feed (Foco em Retenção e Desejo)

Aqui o objetivo é "parar o scroll" e fixar a marca na mente do cliente.

1. **O Close da Mortadella (Carrossel):**
   - **Imagem 1:** Close extremo na textura de uma pizza saindo do forno (bolhas na borda, queijo derretendo).
   - **Imagem 2:** Foto do prato montado (ex: um fettuccine ou a icônica mortadela da casa).
   - **Legenda:** Use o **Template de Legenda Padrão** focado na experiência sensorial de jantar na casa.
2. **Harmonização: Vinho x Prato (Foto Única):**
   - **Visual:** Uma taça de vinho em primeiro plano (foco no líquido) com uma massa ao fundo (desfocada).
   - **Legenda:** Fale sobre a **Carta de Vinhos** da casa. "Você sabia que temos um sommelier que seleciona rótulos para cada prato do nosso menu?".
3. **Inclusividade com Sabor (Foto Dupla):**
   - **Lado A:** Uma pizza tradicional. **Lado B:** Uma opção **Vegana ou Sem Glúten**.
   - **Legenda:** Reforce que no Mortadella ninguém fica de fora. Explique brevemente o cuidado com a contaminação cruzada.
4. **Reels: O Som da Cozinha (Audio Visual):**
   - **Vídeo:** ASMR da cozinha. O barulho da faca cortando, o fogo, o vinho sendo servido.
   - **Objetivo:** Transmitir a **Higiene e Bastidores**.
5. **A Noite Perfeita (Foto de Ambiente):**
   - **Visual:** O salão cheio, luz baixa, pessoas brindando.
   - **Legenda:** Focada no **Vibe Check**. "Aniversário, encontro romântico ou jantar em família? Temos o ambiente certo para cada história."
6. **O "Por trás da Massa" (Humanização):**
   - **Visual:** Foto do Chef ou do pizzaiolo em ação (sorrindo ou focado).
   - **Legenda:** Conte um pouco da história da receita da massa. **Pessoas compram de pessoas.**

---

## 🤳 16 Ideias de Stories (Foco em Engajamento e FAQ)

Divida essas ideias ao longo da semana para manter a constância.

### Bloco 1: Logística e Facilidades (Eliminando Barreiras)

1. **"Onde estacionar?":** Vídeo rápido da fachada mostrando as vagas ou o convênio.
2. **"Tour pelo Espaço Kids":** Mostre os brinquedos e o trocador no banheiro (alívio para os pais).
3. **"Como reservar?":** Print da Bio clicando no link e caindo no WhatsApp.
4. **"Pet Friendly":** Foto de um doguinho no restaurante (com autorização) usando o sticker "Seu pet é bem-vindo".

### Bloco 2: O Cardápio em Detalhes

1. **Enquete de Pizzas:** "Massa fina ou tradicional? Comenta aqui sua preferida".
2. **Destaque Vegano:** Mostre o preparo de um prato plant-based.
3. **Sinalização Inclusiva:** Mostre o cardápio físico e a legenda dos ícones (Sem Glúten/Lactose).
4. **Drink do Dia:** Vídeo do bartender montando um drink "instagramável".

### Bloco 3: Autoridade e Qualidade

1. **A Carta de Vinhos:** Foto da adega com o texto: "Rótulos de [País X, Y e Z] esperam por você".
2. **Bastidores:** Vídeo da higienização das mesas e organização do salão antes de abrir.
3. **O Ingrediente:** Mostre a qualidade do tomate ou da farinha importada que usam.
4. **Dica do Chef:** "Qual vinho combina com essa massa?". Curiosidade rápida.

### Bloco 4: Prova Social e Conversão

1. **Repost de Cliente:** O clássico "Obrigado pela visita" em um story marcado.
2. **Feedback de Avaliação:** Print de um elogio no Google Meu Negócio.
3. **Contagem Regressiva:** "Faltam 2 horas para abrirmos. Já garantiu sua mesa?".
4. **O Grand Finale:** Vídeo da sobremesa sendo servida (aquela que dá água na boca).

## STORIES RECORRENTES ALMOÇO
TÍTULOS:

IMAGEM 72: Aqui o almoço é levado a sério. Venha experimentar hoje!

IMAGEM 39: Carne suculenta e feita na hora!
Estamos servindo agora!

IMAGEM 45: Seu almoço merece esse sabor!
Passe aqui e aproveite!

IMAGEM 49: Prato completo e cheio de sabor!
Vem almoçar com a gente!',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Mortadella Tabajara (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'mortadella-tabajara',
    'Mortadella Tabajara',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '1 FEED SEMANA',
    NULL,
    'https://drive.google.com/drive/u/0/folders/1OqVN8dNCFbz0ZTh-DId74_Y3G6HTz19p',
    'https://www.canva.com/design/DAHAjnku_fU/Q7pJXxmQnEgRVKd6z3pU9A/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa150/attachments/69b9c7abed3b1e981a1ace3b/download/Mortadella_Piscina_Bar_Logo_1.png',
    '{"instagram": "https://www.instagram.com/mortadellapiscinabarttc/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Hamburgueria Feio (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'hamburgueria-feio',
    'Hamburgueria Feio',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED - 3 STORIES SEMANA | 1 TRÁFEGO',
    'https://www.hamburgueriafeio.com.br/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnv-ZEcmuVApRcjSUaBgBrtCcrvVc1Zo0qVkf2J5hCOBDpNHuXZCxsX6M3Qw4_aem_FVoT_-cDVmy8m_Gd3YCh4A',
    'https://drive.google.com/drive/folders/1dmVaKd_aA7e3nOHsqnbkib24kMqFXuWw',
    'https://www.canva.com/design/DAHC01yV0rw/r5ap5C_-gyGgWsdZiC0kdg/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0d2/attachments/69b9c7abed3b1e981a1acd3e/download/logo-feio.png',
    '{"instagram": "https://www.instagram.com/hamburgueria.feio/"}'::jsonb,
    '## STORIES RECORRENTES - SEGUNDA
- **10h45 (Story):** Arte Pronta "Aberto para Almoço".
- **17h45 (Story):** Arte Pronta "Promo Segunda - Cheese Egg".
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h".

## STORIES RECORRENTES - TERÇA
- **10h45 (Story):** Arte Pronta "Aberto para Almoço".
- **11h (Story):** Arte Pronta "Promo Terça - Cheese Salada".
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h".
- **18h00 (Story):** Arte Feio Duplo

## STORIES RECORRENTES - QUARTA
_**os 4 programados-Regina**_

- **10h45 (Story):** Arte Pronta "Aberto para Almoço
- **10h45 (Story):** Você pediria um Americano hoje?
- **11h (Story):** Arte Pronta "Promo Quarta - Feio Original
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h

## STORIES RECORRENTES - QUINTA
_**os 3 programados-Regina**_

- **10h45 (Story):** Arte Pronta "Aberto para Almoço
- **11h (Story):** Arte Pronta "Promo Quinta - Cheese Galinha
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h

## STORIES RECORRENTES - SEXTA
_**os 4 programados-Regina**_

‌

- **10h45 (Story):** Arte Pronta "Aberto para Almoço
- **11h (Story):** Arte Pronta "Promo Sexta - Feio Blumenau
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h
- **18h00 (Story):** Arte Feio Blumenau

## STORIES RECORRENTES - SÁBADO
_**os 4 programados- Regina**_

‌

- **10h45 (Story):** Arte Pronta "Aberto para Almoço"
- **11h30 (Story):** Arte Pronta “O acompanhamento que não pode faltar”
- **11h (Story):** Arte Pronta "Promo Sábado - Pork Burguer”
- **18h00 (Story):** Arte Pronta "Estamos Abertos - 18h”',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Arena Gourmet (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'arena-gourmet',
    'Arena Gourmet',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '1 FEED E 1 STORIES SEMANAL',
    'https://arenagourmetblumenau.com.br/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpLgMVxDJs-UTVIVdKeOoS7RbkIhPZKh8VH_himw4LfylgP5R7vA5i2Gq5hU_aem_x7K0kgSJHCDxrsStDt3pGA',
    'https://drive.google.com/drive/folders/14nnpW80u96t3YmTkIaW-0jrKIn5nO_Sg?usp=sharing',
    'https://www.canva.com/design/DAG_1Bji7gU/yvnMdK4-k6ciLO9CZx1Yjg/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa186/attachments/69b9c7abed3b1e981a1ace96/download/LOGO.png',
    '{"instagram": "https://www.instagram.com/arenadogburger/"}'::jsonb,
    '## IDEIAS DE POSTAGENS
## 📸 6 Ideias para o Feed (Foco em "Porn Food" e Volume)

1. **O "Favorito da Arena" (Foto Única):**
   - **Visual:** Close lateral do **Djem** (hambúrguer de costela no pão australiano). O foco deve ser na cebola caramelizada brilhando e no queijo muçarela derretido.
   - **Legenda:** "O campeão de vendas por um motivo. Já provou o toque da cebola caramelizada no nosso pão australiano artesanal?"
2. **Carrossel: "Monte o seu Combo"**
   - **Visual:** Slide 1: Um dos combos (ex: **Pompeia**). Slide 2: As opções de pão (Australiano, Roseta, Sem Glúten). Slide 3: O acompanhamento (Fritas ou Onion Rings).
   - **Legenda:** "Na Arena, o técnico é você! Escolha seu burger, seu pão e seu acompanhamento favorito."
3. **O Diferencial: Hot Dog Gourmet (Foto Única):**
   - **Visual:** Foto de cima (flat lay) do **Dog 4 Queijos e Bacon**. Muita batata palha e bacon crocante aparecendo.
   - **Legenda:** "Não é apenas um hot dog, é tradição com um toque extra de crocância."
4. **Reels: "O Banho de Queijo" (Vídeo):**
   - **Visual:** Vídeo do hambúrguer recebendo o **Fondue de Queijo** (vi o Arena Fondue no site).
   - **Legenda:** "Cenas fortes para quem está com fome. Quem você marcar aqui te deve um desse!"
5. **Acompanhamentos que Roubam a Cena (Carrossel):**
   - **Visual:** Fotos das **Porkixinhas**, **Aipim Bites** e **Camarão Crock**.
   - **Legenda:** "Aquecimento oficial: nossas porções são o melhor começo para a sua noite."
6. **O Doce Final (Foto Única):**
   - **Visual:** O **Sonho Aplaudido** cortado ao meio, mostrando o recheio de Leite Ninho e Nutella.
   - **Legenda:** "O fechamento com chave de ouro que você merece."

---

## 🤳 16 Ideias de Stories (Engajamento e Conversão Rápida)

**Bloco 1: Praticidade e Entrega (Eliminando Barreiras)**

1. **Tempo de Entrega:** "Sua fome não espera. Pedidos saindo em média em 30 min!"
2. **O Site Arena:** Gravação de tela rápida navegando no site e mostrando como é fácil escolher os adicionais.
3. **Localização:** "Estamos na Rua Benjamin Constant, 1485. Vem retirar ou pede em casa!"
4. **Cashback na Prática:** "Pediu hoje, ganhou 5% de volta para o próximo burger. Já conferiu seu saldo?"

**Bloco 2: Opções e Customização**

5\. **Sem Glúten:** Foto do pão sem glúten sendo montado. "Sabor inclusivo? Temos!"
6\. **Batalha de Pães:** Enquete: "Pão Roseta ou Pão Australiano?".
7\. **Combo Família:** Mostre os 3 burgers + acompanhamento + refri: "A janta da galera está resolvida".
8\. **Drink ou Cerveja:** Mostre as opções de bebidas geladas para acompanhar o burger.

**Bloco 3: Desejo e Curiosidade**

9\. **O Som do Bacon:** ASMR de 5s do bacon fritando na chapa.
10\. **A Maionese da Casa:** "O segredo que todo mundo ama. Quem aí é fã da nossa maionese?".
11\. **Dica do Chef:** "Harmonize seu hambúrguer com uma IPA ou Weiss (vi as dicas de harmonização no site!)".
12\. **Menu Kids:** Foto do **Smash Burguer + Batata Sorriso**. Perfeito para os pequenos.

**Bloco 4: Prova Social e Vendas**

13\. **Repost de Cliente:** Foto de alguém abrindo a caixa da Arena em casa.
14\. **Print de Feedback:** "O melhor burger de Blumenau!" (Avaliação do site/Google).
 15. **Status da Cozinha:** "Chapa quente e motoboys a postos. Qual vai ser o seu pedido?".
16\. **Cupom Relâmpago:** "Os 5 primeiros que responderem esse story ganham a taxa de entrega grátis!".',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Restaurante Oca (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'restaurante-oca',
    'Restaurante Oca',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED + STORIES RECORRENTES',
    'https://pedido.anota.ai/loja/restaurante-oca',
    'https://drive.google.com/drive/folders/1_AFHjM1KseCpid44zUvHn8obtS4t8Tz_?usp=sharing',
    'https://www.canva.com/design/DAHCVQqKG9Q/y2pQOHAM_PvLTJ92y-mH9g/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa297/attachments/69b9c7aced3b1e981a1ad160/download/Frame_269.png',
    '{"instagram": "https://www.instagram.com/restaurante_oca/"}'::jsonb,
    '## STORIES RECORRENTES
**Headlines para Stories:**

Use diariamente entre 10h e 12h:
	1 - Já estamos servindo! Almoço fresquinho até 14h
	2 - Cardápio do dia liberado! Vem almoçar com a gente
	3 - Sem tempo? Peça sua marmita pelo WhatsApp
	4 - Sem tempo de sair? Delivery ON para o seu almoço!
	5 - Comida caseira, feita na hora
	6 - Buffet completo esperando por você
        8 - Do buffet ao delivery: o seu almoço garantido no Restaurante Oca
	7 - Horário de Funcionamento
Seg a Sab das 11h às 14h
Localização: Rua João Pessoa 2957',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Aseyori (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'aseyori',
    'Aseyori',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '1 ARTE SEMANAL | FEED TRÁFEGO',
    NULL,
    'https://drive.google.com/drive/folders/1PEF1b0aYangnmtJDGaPQ11Pc1EFDu617',
    'https://www.canva.com/design/DAHAXnTYUfM/4fKTBFrqpnPVg920DSS_gg/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa1ef/attachments/69b9c7aced3b1e981a1acf64/download/logo_aseyori_final_PNG.pdf',
    '{"instagram": "https://www.instagram.com/aseyorisushieforneria/"}'::jsonb,
    '## 4 STORIES - PROMOÇÕES RECORRENTES
HEADLINES:

STORY 1 – Seg, Ter e Qui
Sequência livre por R$105 com reserva até 17h30!

Alternativas:
	•	Seu rodízio japonês com preço especial!
	•	Reserve até 17h30 e pague menos na sequência!

Observação (texto menor)
Bancada livre + temakis, ceviche, hots doces e salgados, sashimis (salmão, atum, peixe branco e polvo).

⸻

STORY 2 – Quarta
Quarta imperdível: Hot em dobro + 30% OFF nos uramakis!

Observação (texto menor)
Hot sempre será de salmão

⸻

STORY 3 – Sexta
Sexta com 10% OFF em todos os combinados!

Alternativas:
	•	Seu combinado favorito com desconto hoje!
	•	Sexta é dia de garantir seu combo com 10% OFF!

⸻

STORY 4 – Sábado
Rodízio de pizza + sushi por R$85,00 por pessoa com reserva até 17h30!

Alternativas:
	•	Sábado completo: pizza + sushi por preço especial!
	•	Reserve até 17h30 e pague menos no rodízio!

Observação (texto menor)
Após esse horário R$ 90,00 por pessoa.',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Madrugão 3 Lojas (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'madrugao-3-lojas',
    'Madrugão 3 Lojas',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 FEED SEMANA + 7 STORIES INTERCALADOS RECORRENTES',
    'https://madrugaolanches.menudino.com/',
    'https://drive.google.com/drive/folders/1eEILcg9LBXISFiITI3je1Q08nWPThAHL',
    'https://www.canva.com/design/DAHASvaY7hk/g5iyOicA5AdZrlLvw4v43w/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa1f5/attachments/69b9c7aced3b1e981a1acf6b/download/1000103503.PNG',
    '{"instagram": "https://www.instagram.com/madrugao_centro/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Super X (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'super-x',
    'Super X',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '1 FEED SEMANAL (TRÁFEGO) - 2 LOJAS',
    'https://pedir.delivery/app/superxgaruva/menu',
    'https://drive.google.com/drive/folders/1FLfpmkvkiecUWQ6w8W5lWZ6fftGBI9uK',
    'https://www.canva.com/design/DAG_Q1JmHBM/tNoMJ9rjytOTw5N4NI6-Xw/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa22e/attachments/69b9c7aced3b1e981a1acfe6/download/LOGO.png',
    '{"instagram": "https://www.instagram.com/superxguaratuba/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Super X - Itapoá (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'super-x-itapoa',
    'Super X - Itapoá',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    NULL,
    NULL,
    'https://drive.google.com/drive/folders/1OFW0HiG1SjwGJL0Aow67n4QyrqFLlrnL?usp=sharing',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa30c/attachments/69b9c7aced3b1e981a1ad3c7/download/LOGO.png',
    '{}'::jsonb,
    '## Stories recorrentes
1. Estamos chegando Itapoá!
2. Sua fome vai ter novo endereço para ser saciada!
3. O **Super X** está chegando em Itapoá para mudar o jeito que você come lanche.
4. Não é só um lanche. É uma experiência. Estamos chegando itapoá!
5. Falta pouco para voce provar o SUPER X e ressignificar seus momentos!

‌

escolha livre de fotos

[https://drive.google.com/drive/folders/1Q4VsOy5CDCA1f42Sn6SkKGEfAFuoTRnT](https://drive.google.com/drive/folders/1Q4VsOy5CDCA1f42Sn6SkKGEfAFuoTRnT "smartCard-inline")',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Realizzati Móveis (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'realizzati-moveis',
    'Realizzati Móveis',
    'starken',
    'Movelaria',
    'Juan',
    'standby',
    '2 FEED + STORIES RECORRENTES',
    'https://orcamentos.realizzatimoveis.com.br/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnvJyDMzajbdDYCI8rjfK6K5siJcPjgE0bzN9LnkQ0Qt42K4gDhgbrF5PoYpk_aem_sQ760pfDT0tiASEFdazM_g',
    'https://drive.google.com/drive/folders/1KKNXoTwq79D1JAmmkoCL1wX9WQM2jsPl?usp=drive_link',
    'https://www.canva.com/design/DAG-m1VitjA/v-EEkd-qPW0C9uPB52nnIQ/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa23a/attachments/69b9c7aced3b1e981a1ad02d/download/02.png',
    '{"instagram": "https://www.instagram.com/realizzatimoveis?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="}'::jsonb,
    '## 2 FEED + STORIES RECORRENTES
Obs.: Esse é o detalhamento dessa obra não consigo por na pasta
Mandei caso vocês tiver alguma ideia pra usar
Pro Cleinte saber que além do projeto 3d tbm fazemos todo esse trabalho de detalhamento técnico e enviamos pra eles tbm

[Memorial Hess living 01.pdf](https://trello.com/1/cards/6970d424d981cc3b5af8f1bf/attachments/69837e1470c9fa5e6f50fd14/download/Memorial_Hess_living_01.pdf "‌")

[Memorial Hess  living Aprovado pra produção..pdf](https://trello.com/1/cards/6970d424d981cc3b5af8f1bf/attachments/69837e1cc297eb7a06da2999/download/Memorial_Hess__living_Aprovado_pra_produ%C3%A7%C3%A3o..pdf "‌")

[Memorial Familia Hess Quartos Suites.pdf](https://trello.com/1/cards/6970d424d981cc3b5af8f1bf/attachments/69837e21923f9e3dc6f8f697/download/Memorial_Familia_Hess_Quartos_Suites.pdf "‌")

‌

Títulos curtos

- Cozinha sob medida
- Design que transforma
- Funcionalidade e estilo
- Projeto pensado para você
- Elegância em cada detalhe
- Onde o design encontra a funcionalidade
- Sofisticação sob medida
- Design inteligente
- Seu espaço, do seu jeito

Se quiser algo com leve apelo comercial (sem exagero):

- Projetos exclusivos 3D
- Soluções sob medida
- Marcenaria que valoriza
- Personalização que faz sentido

‌

- Agende seu atendimento e transforme seu espaço
- É sobre montar tudo do seu jeito
- Serviços que evidenciam o seu ambiente!
- Planeje seus móveis com precisão!
- ✅ Matérias de alta qualidade
  ✅ Desiy exclusivo
  ✅ Atendimento personalizado

OBS.: EM ANEXO IDEIAS DE LAYOUT',
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Jpr Rústicos (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'jpr-rusticos',
    'Jpr Rústicos',
    'starken',
    'Movelaria',
    'Juan',
    'ativo',
    '2 FEED + 5 STORIES',
    'https://jprmovesrusticos.netlify.app/index-nova.html',
    'https://drive.google.com/drive/folders/1k6ntgwgZearpoVANCj1xvj9DjDP87GxR',
    'https://www.canva.com/design/DAHC0ZoA1_8/BCJ5L8FX-9h6r8WHH9_2xQ/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa24f/attachments/69b9c7aced3b1e981a1ad0ba/download/Logo_03.png',
    '{"instagram": "https://www.instagram.com/jpr.moveisrusticos?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Suprema Pizza (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'suprema-pizza',
    'Suprema Pizza',
    'starken',
    'Gastronomia',
    'Juan',
    'ativo',
    '2 ARTES FEED SEMANA | 14 STORIES SEMANA',
    NULL,
    'https://drive.google.com/drive/folders/1fDB4Mjj3LvZS3Ayv3WC_W8-xGK_AZoCD',
    'https://www.canva.com/design/DAG-UmirBrE/oYHPt_1N98Fdf7LaTGTn-A/edit?utm_content=DAG-UmirBrE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0b7/attachments/69b9c7abed3b1e981a1acd2d/download/logo.pdf',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- The Garrison (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'the-garrison',
    'The Garrison',
    'starken',
    'Gastronomia',
    'Henrique',
    'ativo',
    '1 ARTE FEED TRÁFEGO + ORGÂNICO + SOB DEMANDAS FIXOS E EVENTOS',
    'https://www.thegarrisonrds.com.br/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnc3PDEONa4OR_baBS7MjCKKlaJjROW9LGLf-mfUEAsE-lgtvru_k9ZdapZoI_aem_LAGisnUyRgquec6yAEsPrw',
    'https://drive.google.com/drive/u/0/folders/1iMKLRtjwSrG3PbRM10iCtAg3o0_xXNX4',
    'https://www.canva.com/design/DAHCVJ86xTM/jDw831dO1Ok5XGHR6eOmQw/edit',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa2e8/attachments/69b9c7aced3b1e981a1ad354/download/Logo_Garrison.png',
    '{"instagram": "https://www.instagram.com/thegarrison_rds/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Melhor Visão (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'melhor-visao',
    'Melhor Visão',
    'starken',
    'Saúde',
    'Juan',
    'ativo',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Academia São Pedro (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'academia-sao-pedro',
    'Academia São Pedro',
    'starken',
    'Academia',
    'Emily',
    'ativo',
    '2 FEED SEMANA',
    NULL,
    'https://drive.google.com/drive/folders/1-EWFI6GG6hKYgJTnJg13m6pmsg41luZG',
    'https://www.canva.com/design/DAHCzNgJWwE/xkfPfjgbeUNw8y7Sq8PJnw/edit?utm_content=DAHCzNgJWwE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa2ca/attachments/69b9c7aced3b1e981a1ad1aa/download/LOGO_FUNDO_BRANCO.png',
    '{"instagram": "https://www.instagram.com/academiasaopedro?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- New Service Indus. Química (starken)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'new-service-indus-quimica',
    'New Service Indus. Química',
    'starken',
    'Indústria',
    'Henrique',
    'ativo',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Super Duper (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'super-duper',
    'Super Duper',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    '2 ARTE FEED | 3 STORY',
    NULL,
    'https://drive.google.com/drive/folders/15GLWWOJyIbKpVIMlybz_f_vKg07Ow5e2',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa1d4/attachments/69b9c7aced3b1e981a1acf4e/download/Logo_duper_vetor.png',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Fratelli's (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'fratellis',
    'Fratelli''s',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    '2 FEEDS | 1 TRÁF. PAGO',
    'https://www.fratellispizzaria.com.br/',
    'https://drive.google.com/drive/folders/11UsYP1EkTYNYu5g3b_JK_UFcIrS27MCd',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0f0/attachments/69b9c7abed3b1e981a1acd4e/download/panfleto-fratelli_s-ok_1.png',
    '{"instagram": "https://www.instagram.com/fratellispizzaria/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Saporito (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'saporito',
    'Saporito',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    '2 FEEDS | 1 TRÁF. PAGO',
    'https://www.ifood.com.br/delivery/blumenau-sc/saporito-super-pizzaria---15-anos-escola-agricola/591017c4-05cf-460e-92e1-0020dcbccf0c',
    'https://drive.google.com/drive/folders/1pBTb540zHpTuxkJviWYh2-N6OtN0n7j-',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa0f9/attachments/69b9c7abed3b1e981a1acd56/download/image.png',
    '{"instagram": "https://www.instagram.com/saporitopizza/"}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- World Burger (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'world-burger',
    'World Burger',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    '2 ARTES FEED SEMANA | 1 TRÁF.',
    NULL,
    'https://drive.google.com/drive/folders/1SOIs4oDgoLE25lOUmSzexuQLzNmQni67',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa261/attachments/69b9c7aced3b1e981a1ad0c4/download/World_Burguer.png',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Churrascaria Paiaguas (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'churrascaria-paiaguas',
    'Churrascaria Paiaguas',
    'alpha',
    'Gastronomia',
    'Juan',
    'ativo',
    '1 ARTE SEMANAL | FEED TRÁFEGO',
    NULL,
    NULL,
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa29d/attachments/69b9c7aced3b1e981a1ad175/download/Design_sem_nome.png',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Patrícia Salgados (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'patricia-salgados',
    'Patrícia Salgados',
    'alpha',
    'Gastronomia',
    'Emily',
    'ativo',
    '1 ARTE SEMANAL -  FEED | TRÁFEGO | STORY',
    NULL,
    'https://drive.google.com/drive/folders/16be9LStBuzrxlLz0MrfFzMKyCNJdaVUh',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa27f/attachments/69b9c7aced3b1e981a1ad153/download/31c906cb-dd95-474a-b504-47469dd7cba9.jpg.jpeg',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Pizzaria do Nei (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'pizzaria-do-nei',
    'Pizzaria do Nei',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    NULL,
    NULL,
    'https://drive.google.com/drive/folders/1y5gMaZNE54K-dB1fu403_MEZFONMXTJz',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa429/attachments/69b9c7aced3b1e981a1ad60b/download/Gemini_Generated_Image_i4uw5ri4uw5ri4uw.png',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Salfest (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'salfest',
    'Salfest',
    'alpha',
    'Gastronomia',
    'Emily',
    'ativo',
    '1 ARTE SEMANAL -  FEED | TRÁFEGO | STORY',
    NULL,
    'https://drive.google.com/drive/folders/1DUKR7VCEzbKGas6ctAM8NVbnAerPf1g1',
    NULL,
    'https://trello.com/1/cards/69b9c7a8ed3b1e981a1aa2af/attachments/69b9c7aced3b1e981a1ad17e/download/WhatsApp_Image_2026-02-09_at_14.41.44.jpeg',
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Where2go (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'where2go',
    'Where2go',
    'alpha',
    'Turismo',
    'Emily',
    'ativo',
    '1 ARTE SEMANAL | FEED TRÁFEGO',
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- Mestre do Frango (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'mestre-do-frango',
    'Mestre do Frango',
    'alpha',
    'Gastronomia',
    'Henrique',
    'ativo',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();

-- D Britos Petiscos (alpha)
INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    'd-britos-petiscos',
    'D Britos Petiscos',
    'alpha',
    'Gastronomia',
    'Emily',
    'ativo',
    '1 ARTE SEMANAL | FEED TRÁFEGO',
    NULL,
    'https://drive.google.com/drive/folders/1Z-up-owk6lPglcp8SDaxQ_jm6zoZ-1u8?direction=d',
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    'system-import'
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();
