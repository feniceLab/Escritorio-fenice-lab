#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
processar_trello.py
Extrai estrutura completa do Trello para criar template Asana
"""

import json
import re
from collections import defaultdict

# Ler arquivo
arquivo = r"C:\Users\juanf\OneDrive\Documents\ASSESSORIA\Exportacao Trello\8kSs8AcB - starken-alpha.json"

with open(arquivo, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extrair dados
board_name = data.get('name', 'N/A')
listas = data.get('lists', [])
cards = data.get('cards', [])

print("\n" + "=" * 70)
print("ANALISE COMPLETA DO TRELLO - STARKEN ALPHA")
print("=" * 70)

# As "listas" no Trello sao na verdade os CLIENTES
# Vamos estruturar diferente
print(f"\nBoard: {board_name}")
print(f"Numero de CLIENTES (colunas/listas): {len(listas)}")
print(f"Total de CARDS: {len(cards)}\n")

# Extrair estrutura por cliente
cliente_estrutura = defaultdict(lambda: {'cards': [], 'tipos': set()})

for lista in listas:
    lista_id = lista.get('id')
    cliente_nome = lista.get('name', '').strip()

    # Pegar cards dessa lista
    cards_lista = [c for c in cards if c.get('idList') == lista_id]

    # Agrupar por tipo de card
    tipos = set()
    for card in cards_lista:
        nome = card.get('name', '').upper()
        # Extrair tipo (primeira palavra significativa)
        if 'ANDAMENTO' in nome:
            tipos.add('ANDAMENTO DA SEMANA')
        elif 'FEED' in nome or 'STORIES' in nome:
            tipos.add('2 FEED SEMANA + 7 STORIES')
        elif 'ACESSOS' in nome:
            tipos.add('ACESSOS')
        elif 'LINK' in nome and 'DRIVE' in nome:
            tipos.add('LINK DRIVE')
        elif 'LINK' in nome and 'APROVACAO' in nome:
            tipos.add('LINK APROVACAO DE CRONOGRAMA')
        elif 'LOGO' in nome:
            tipos.add('LOGO')
        elif 'SEMANA' in nome:
            tipos.add('SEMANA XX/XX')

    cliente_estrutura[cliente_nome]['cards'] = len(cards_lista)
    cliente_estrutura[cliente_nome]['tipos'] = list(tipos)

# Imprimir clientes
print("CLIENTES (Colunas do Trello):")
print("-" * 70)

clientes_starken = []
clientes_alpha = []

for cliente in sorted(cliente_estrutura.keys()):
    info = cliente_estrutura[cliente]
    print(f"\n{cliente}")
    print(f"  Cards: {info['cards']}")
    if info['tipos']:
        print(f"  Tipos: {', '.join(info['tipos'][:3])}")

    if 'STARKEN' in cliente.upper():
        clientes_starken.append(cliente)
    elif 'ALPHA' in cliente.upper():
        clientes_alpha.append(cliente)

# Template final
template = {
    "board": {
        "name": board_name,
        "total_clientes": len(cliente_estrutura),
        "total_cards": len(cards)
    },
    "clientes_starken": len(clientes_starken),
    "clientes_alpha": len(clientes_alpha),
    "estrutura_padrao": [
        "ANDAMENTO DA SEMANA",
        "2 FEED SEMANA + 7 STORIES",
        "ACESSOS",
        "LINK DRIVE",
        "LINK APROVACAO DE CRONOGRAMA",
        "LOGO",
        "SEMANA XX/XX"
    ],
    "clientes": list(cliente_estrutura.keys())
}

# Salvar
output = r"C:\Users\juanf\OneDrive\Documents\ASSESSORIA\trello_analise_completa.json"
with open(output, 'w', encoding='utf-8') as f:
    json.dump(template, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 70)
print(f"\nRESUMO:")
print(f"  Clientes STARKEN: {len(clientes_starken)}")
print(f"  Clientes ALPHA: {len(clientes_alpha)}")
print(f"  Total: {len(cliente_estrutura)}")
print(f"\n  Arquivo salvo: trello_analise_completa.json")
print("=" * 70 + "\n")

