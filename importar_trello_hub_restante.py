#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
importar_trello_hub_restante.py
Importa APENAS os cards restantes do Trello (a partir de Arena Gourmet card 8+)
"""

import json
import time
import urllib.request
import urllib.error
import os

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"

HUB_PROJECTS = {
    "Starken": "1213723134141124",
    "Alpha": "1213723818393248",
}

TRELLO_TO_HUB = {
    "STARKEN | ROSA MEXICANO BLUMENAU": ("Starken", "Rosa Mexicano Blumenau"),
    "STARKEN | ROSA MEXICANO BRUSQUE": ("Starken", "Rosa Mexicano Brusque"),
    "STARKEN | MORTADELLA": ("Starken", "Mortadella Blumenau"),
    "STARKEN | MORTADELLA TABAJARA": ("Starken", "Mortadella Blumenau"),
    "STARKEN | HAMBURGUERIA FEIO": ("Starken", "Hamburgueria Feio"),
    "STARKEN | SUPREMA PIZZA": ("Starken", "Suprema Pizza"),
    "STARKEN | ARENA GOURMET": ("Starken", "Arena Gourmet"),
    "STARKEN | SUPER X": ("Starken", "Super X - Garuva"),
    "STARKEN | SUPER X - ITAPO\u00c1": ("Starken", "Super X - Itapoa"),
    "STARKEN | MADRUG\u00c3O 3 LOJAS": ("Starken", "Madrugao - Centro"),
    "STARKEN | RESTAURANTE OCA": ("Starken", "Restaurante Oca"),
    "STARKEN | ASEYORI": ("Starken", "Aseyori Restaurante"),
    "STARKEN | THE GARRISON (BRUNA)": ("Starken", "The Garrison"),
    "STARKEN | JPR R\u00daSTICOS": ("Starken", "JPR Moveis Rusticos"),
    "STARKEN | MELHOR VIS\u00c3O (MARINA)": ("Starken", "Melhor Visao"),
    "STARKEN | ACADEMIA S\u00c3O PEDRO (EMILLY) Planejamento, execu\u00e7\u00e3o e BM": ("Starken", "Academia Sao Pedro"),
    "STARKEN | NEW SERVICE INDUS. QU\u00cdMICA (BRUNA)": ("Starken", "New Service"),
    "STARKEN | REALIZZATI M\u00d3VEIS (STANDBY)": ("Starken", "JPR Moveis Rusticos"),
    "CRONOGRAMAS P ENVIAR": None,
    "DEMANDAS HENRIQUE": None,
}

# Listas ja importadas completamente (antes do crash)
LISTAS_JA_IMPORTADAS = {
    "ALPHA | CHURRASCARIA PAIAGUAS",
    "ALPHA | D BRITOS PETISCOS (EMILLY)",
    "ALPHA | FRATELLI'S (BRUNA)",
    "ALPHA | MESTRE DO FRANGO (BRUNA)",
    "ALPHA | PATR\u00cdCIA SALGADOS (EMILLY)",
    "ALPHA | PIZZARIA DO NEI (BRUNA)",
    "ALPHA | SALFEST (EMILLY)",
    "ALPHA | SAPORITO (BRUNA)",
    "ALPHA | SUPER DUPER (BRUNA)",
    "ALPHA | WHERE2GO (EMILLY)",
    "ALPHA | WORLD BURGER (BRUNA)",
    "STARKEN | ACADEMIA S\u00c3O PEDRO (EMILLY) Planejamento, execu\u00e7\u00e3o e BM",
}

# Arena Gourmet: 8 dos 14 cards ja importados, comecar do card 9
ARENA_SKIP = 8


def asana_request(method, endpoint, data=None):
    url = f"{ASANA_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {ASANA_PAT}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    body = None
    if data:
        body = json.dumps({"data": data}).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"  ERRO {e.code}: {error_body[:200]}")
        return None
    except Exception as e:
        print(f"  ERRO: {e}")
        return None


def main():
    base_dir = os.path.dirname(__file__)

    with open(os.path.join(base_dir, "asana_hub_sections.json"), "r", encoding="utf-8") as f:
        hub_sections = json.load(f)

    trello_file = os.path.join(base_dir, "Exportacao Trello", "8kSs8AcB - starken-alpha.json")
    with open(trello_file, "r", encoding="utf-8") as f:
        trello = json.load(f)

    listas = {l["id"]: l["name"] for l in trello.get("lists", []) if not l.get("closed")}
    cards_por_lista = {}
    for card in trello.get("cards", []):
        if card.get("closed"):
            continue
        lid = card.get("idList")
        lista_nome = listas.get(lid)
        if not lista_nome:
            continue
        if lista_nome not in cards_por_lista:
            cards_por_lista[lista_nome] = []
        cards_por_lista[lista_nome].append(card)

    print("=" * 70)
    print("IMPORTANDO CARDS RESTANTES DO TRELLO")
    print("=" * 70)

    total_importados = 0
    total_pulados = 0
    erros = []

    for lista_nome, cards in sorted(cards_por_lista.items()):
        # Pular listas ja importadas
        if lista_nome in LISTAS_JA_IMPORTADAS:
            print(f"\n  JA IMPORTADO: {lista_nome.encode('ascii', 'replace').decode('ascii')}")
            continue

        mapping = TRELLO_TO_HUB.get(lista_nome)

        if mapping is None:
            safe = lista_nome.encode("ascii", "replace").decode("ascii")
            print(f"\n  PULANDO: {safe} ({len(cards)} cards)")
            total_pulados += len(cards)
            continue

        if lista_nome not in TRELLO_TO_HUB:
            safe = lista_nome.encode("ascii", "replace").decode("ascii")
            print(f"\n  SEM MAPEAMENTO: {safe} ({len(cards)} cards)")
            total_pulados += len(cards)
            continue

        empresa, cliente_nome = mapping
        section_gid = hub_sections.get(cliente_nome)
        project_gid = HUB_PROJECTS[empresa]

        if not section_gid:
            print(f"\n  SECAO NAO ENCONTRADA: {cliente_nome}")
            erros.append(f"Secao nao encontrada: {cliente_nome}")
            total_pulados += len(cards)
            continue

        # Calcular skip para Arena Gourmet
        skip = 0
        if "ARENA GOURMET" in lista_nome:
            skip = ARENA_SKIP

        safe_lista = lista_nome.encode("ascii", "replace").decode("ascii")
        cards_to_import = cards[skip:]
        print(f"\n  {safe_lista} -> {cliente_nome} ({len(cards_to_import)} cards)")

        for card in cards_to_import:
            card_nome = card.get("name", "Sem nome")
            card_desc = card.get("desc", "")

            notas_parts = []
            if card_desc:
                notas_parts.append(card_desc)
            labels = [l.get("name", "") for l in card.get("labels", []) if l.get("name")]
            if labels:
                notas_parts.append(f"Labels Trello: {', '.join(labels)}")
            if card.get("url"):
                notas_parts.append(f"Card Trello original: {card['url']}")
            notas = "\n\n".join(notas_parts)

            task_data = {
                "name": f"[Trello] {card_nome}",
                "projects": [project_gid],
            }
            if notas:
                task_data["notes"] = notas
            if card.get("due"):
                task_data["due_on"] = card["due"][:10]

            result = asana_request("POST", "/tasks", task_data)
            if result and result.get("data"):
                task_gid = result["data"]["gid"]
                asana_request("POST", f"/sections/{section_gid}/addTask", {
                    "task": task_gid,
                })
                total_importados += 1
                safe_nome = card_nome[:50].encode("ascii", "replace").decode("ascii")
                print(f"    + {safe_nome}")
            else:
                erros.append(f"Erro: {card_nome[:50]}")

            time.sleep(0.2)

    print(f"\n{'=' * 70}")
    print("IMPORTACAO CONCLUIDA!")
    print(f"  Cards importados nesta rodada: {total_importados}")
    print(f"  Cards pulados: {total_pulados}")
    if erros:
        print(f"  Erros ({len(erros)}):")
        for e in erros[:10]:
            print(f"    - {e}")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
