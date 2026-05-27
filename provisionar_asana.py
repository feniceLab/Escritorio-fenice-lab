#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
provisionar_asana.py

Cria a estrutura COMPLETA no Asana:
- 35 clientes (25 Starken + 10 Alpha)
- 1 projeto por cliente (com secoes padrao do Trello)
- Importa cards do Trello quando disponivel

Uso:
  python3 provisionar_asana.py
"""

import json
import time
import urllib.request
import urllib.error
import sys
import os

# ============================================================================
# CONFIGURACAO
# ============================================================================

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"

# Workspace GID - sera detectado automaticamente
WORKSPACE_GID = None

# ============================================================================
# CLIENTES DO SISTEMA (SEED_CLIENTS completo)
# ============================================================================

CLIENTES = {
    "Alpha": [
        {"nome": "Mestre do Frango Passo Fundo", "segmento": "Gastronomia"},
        {"nome": "Patricia Salgados", "segmento": "Gastronomia"},
        {"nome": "Pizzaria do Nei", "segmento": "Gastronomia"},
        {"nome": "Super Duper", "segmento": "Gastronomia"},
        {"nome": "Sorveteria Maciel", "segmento": "Gastronomia"},
        {"nome": "WorldBurguer", "segmento": "Gastronomia"},
        {"nome": "Salfest", "segmento": "Gastronomia"},
        {"nome": "Saporito Pizzaria", "segmento": "Gastronomia"},
        {"nome": "D' Britos", "segmento": "Gastronomia"},
        {"nome": "Fratellis Pizzaria", "segmento": "Gastronomia"},
    ],
    "Starken": [
        # Gastronomia
        {"nome": "Mortadella Blumenau", "segmento": "Gastronomia"},
        {"nome": "Hamburgueria Feio", "segmento": "Gastronomia"},
        {"nome": "Rosa Mexicano Blumenau", "segmento": "Gastronomia"},
        {"nome": "Rosa Mexicano Brusque", "segmento": "Gastronomia"},
        {"nome": "Suprema Pizza", "segmento": "Gastronomia"},
        {"nome": "Arena Gourmet", "segmento": "Gastronomia"},
        {"nome": "Super X - Garuva", "segmento": "Gastronomia"},
        {"nome": "Super X - Guaratuba", "segmento": "Gastronomia"},
        {"nome": "Madrugao - Centro", "segmento": "Gastronomia"},
        {"nome": "Madrugao - Garcia", "segmento": "Gastronomia"},
        {"nome": "Madrugao - Fortaleza", "segmento": "Gastronomia"},
        {"nome": "Restaurante Oca", "segmento": "Gastronomia"},
        {"nome": "Aseyori Restaurante", "segmento": "Gastronomia"},
        {"nome": "Super X - Itapoa", "segmento": "Gastronomia"},
        {"nome": "Oklahoma Burger", "segmento": "Gastronomia"},
        {"nome": "Pizzaria Super X", "segmento": "Gastronomia"},
        {"nome": "Sr Salsicha", "segmento": "Gastronomia"},
        # Outros segmentos
        {"nome": "The Garrison", "segmento": "Eventos"},
        {"nome": "JPR Moveis Rusticos", "segmento": "Mesas p/ Area de Festas"},
        {"nome": "Estilo Tulipa", "segmento": "Artigos de Tenis"},
        {"nome": "Academia Sao Pedro", "segmento": "Academia"},
        {"nome": "New Service", "segmento": "Industria"},
        {"nome": "Melhor Visao", "segmento": "Clinica Otica"},
        {"nome": "Bengers - Empresa", "segmento": "Eventos"},
        {"nome": "Dommus Smart Home", "segmento": "Automacao Residencial"},
    ]
}

# ============================================================================
# SECOES PADRAO (baseadas no Trello)
# ============================================================================

SECOES_PADRAO = [
    "ANDAMENTO DA SEMANA",
    "FEED + STORIES",
    "ACESSOS",
    "LINK DRIVE",
    "LINK APROVACAO DE CRONOGRAMA",
    "LOGO / ASSETS",
    "CRONOGRAMA SEMANAL",
]

# ============================================================================
# HELPERS
# ============================================================================

def asana_request(method, endpoint, data=None):
    """Faz requisicao para a API do Asana"""
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


def get_workspace():
    """Detecta o workspace automaticamente"""
    result = asana_request("GET", "/users/me?opt_fields=workspaces.name")
    if result and result.get("data"):
        workspaces = result["data"].get("workspaces", [])
        if workspaces:
            ws = workspaces[0]
            print(f"Workspace detectado: {ws['name']} (GID: {ws['gid']})")
            return ws["gid"]
    return None


def criar_projeto(workspace_gid, nome_projeto, cor="light-green"):
    """Cria um projeto no Asana"""
    result = asana_request("POST", "/projects", {
        "name": nome_projeto,
        "workspace": workspace_gid,
        "color": cor,
        "default_view": "list",
    })

    if result and result.get("data"):
        return result["data"]["gid"]
    return None


def criar_secao(project_gid, nome_secao):
    """Cria uma secao dentro de um projeto"""
    result = asana_request("POST", f"/projects/{project_gid}/sections", {
        "name": nome_secao,
    })

    if result and result.get("data"):
        return result["data"]["gid"]
    return None


def criar_tarefa(project_gid, section_gid, nome, notas=""):
    """Cria uma tarefa dentro de uma secao"""
    data = {
        "name": nome,
        "projects": [project_gid],
    }
    if notas:
        data["notes"] = notas

    result = asana_request("POST", "/tasks", data)

    if result and result.get("data"):
        task_gid = result["data"]["gid"]
        # Mover para a secao correta
        if section_gid:
            asana_request("POST", f"/sections/{section_gid}/addTask", {
                "task": task_gid,
            })
        return task_gid
    return None


# ============================================================================
# IMPORTACAO DO TRELLO
# ============================================================================

def carregar_trello():
    """Carrega dados do Trello exportado"""
    arquivo = os.path.join(
        os.path.dirname(__file__),
        "Exportacao Trello",
        "8kSs8AcB - starken-alpha.json"
    )
    if not os.path.exists(arquivo):
        print("Arquivo Trello nao encontrado, pulando importacao")
        return None

    with open(arquivo, "r", encoding="utf-8") as f:
        return json.load(f)


def mapear_cards_trello(trello_data):
    """Mapeia cards do Trello por lista (cliente)"""
    if not trello_data:
        return {}

    listas = {l["id"]: l["name"] for l in trello_data.get("lists", [])}
    cards_por_lista = {}

    for card in trello_data.get("cards", []):
        lista_id = card.get("idList")
        lista_nome = listas.get(lista_id, "Desconhecido")

        if lista_nome not in cards_por_lista:
            cards_por_lista[lista_nome] = []

        cards_por_lista[lista_nome].append({
            "nome": card.get("name", ""),
            "desc": card.get("desc", ""),
            "url": card.get("url", ""),
            "labels": [l.get("name", "") for l in card.get("labels", [])],
        })

    return cards_por_lista


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "=" * 70)
    print("PROVISIONAMENTO ASANA - STARKEN & ALPHA")
    print("=" * 70)

    # 1. Detectar workspace
    print("\n[1/4] Detectando workspace...")
    global WORKSPACE_GID
    WORKSPACE_GID = get_workspace()
    if not WORKSPACE_GID:
        print("ERRO: Nao foi possivel detectar o workspace. Verifique o ASANA_PAT.")
        sys.exit(1)

    # 2. Carregar dados do Trello
    print("\n[2/4] Carregando dados do Trello...")
    trello_data = carregar_trello()
    cards_trello = mapear_cards_trello(trello_data)
    if cards_trello:
        print(f"  {len(cards_trello)} listas com cards encontradas no Trello")
    else:
        print("  Sem dados do Trello (criando estrutura vazia)")

    # 3. Provisionar clientes
    print("\n[3/4] Provisionando clientes...")

    total_clientes = sum(len(v) for v in CLIENTES.values())
    total_projetos = 0
    total_secoes = 0
    total_tarefas = 0
    erros = []

    resultado = {"empresas": {}}

    for empresa, clientes in CLIENTES.items():
        print(f"\n  === {empresa.upper()} ({len(clientes)} clientes) ===")
        resultado["empresas"][empresa] = []

        cor = "light-blue" if empresa == "Starken" else "light-green"

        for i, cliente in enumerate(clientes, 1):
            nome = cliente["nome"]
            segmento = cliente["segmento"]
            projeto_nome = f"{empresa} | {nome}"

            print(f"\n  [{i}/{len(clientes)}] {projeto_nome} ({segmento})")

            # Criar projeto
            project_gid = criar_projeto(WORKSPACE_GID, projeto_nome, cor)
            if not project_gid:
                erros.append(f"Erro ao criar projeto: {projeto_nome}")
                continue

            total_projetos += 1
            print(f"    Projeto criado: {project_gid}")

            # Criar secoes padrao
            secoes_criadas = {}
            for secao_nome in SECOES_PADRAO:
                secao_gid = criar_secao(project_gid, secao_nome)
                if secao_gid:
                    secoes_criadas[secao_nome] = secao_gid
                    total_secoes += 1
                # Rate limiting (Asana limita 1500 req/min)
                time.sleep(0.15)

            print(f"    {len(secoes_criadas)} secoes criadas")

            # Importar cards do Trello se existirem
            # Procurar lista correspondente no Trello
            trello_lista_nome = None
            for lista_nome in cards_trello:
                # Match parcial
                nome_upper = nome.upper()
                if nome_upper in lista_nome.upper() or any(
                    p in lista_nome.upper()
                    for p in nome_upper.split()
                    if len(p) > 3
                ):
                    trello_lista_nome = lista_nome
                    break

            if trello_lista_nome and trello_lista_nome in cards_trello:
                cards = cards_trello[trello_lista_nome]
                print(f"    Importando {len(cards)} cards do Trello...")

                # Mapear cards para secoes
                for card in cards:
                    card_nome = card["nome"].upper()
                    target_section = None

                    # Mapear para secao correta
                    if "ANDAMENTO" in card_nome:
                        target_section = "ANDAMENTO DA SEMANA"
                    elif "FEED" in card_nome or "STORIES" in card_nome:
                        target_section = "FEED + STORIES"
                    elif "ACESSOS" in card_nome:
                        target_section = "ACESSOS"
                    elif "DRIVE" in card_nome:
                        target_section = "LINK DRIVE"
                    elif "APROVACAO" in card_nome or "APROVAC" in card_nome:
                        target_section = "LINK APROVACAO DE CRONOGRAMA"
                    elif "LOGO" in card_nome:
                        target_section = "LOGO / ASSETS"
                    elif "SEMANA" in card_nome:
                        target_section = "CRONOGRAMA SEMANAL"

                    section_gid = secoes_criadas.get(target_section)

                    # Criar tarefa
                    notas = card.get("desc", "")
                    if card.get("url"):
                        notas += f"\n\nLink Trello original: {card['url']}"

                    task_gid = criar_tarefa(
                        project_gid,
                        section_gid,
                        card["nome"],
                        notas
                    )
                    if task_gid:
                        total_tarefas += 1

                    time.sleep(0.15)  # Rate limiting

            resultado["empresas"][empresa].append({
                "nome": nome,
                "segmento": segmento,
                "project_gid": project_gid,
                "secoes": len(secoes_criadas),
            })

    # 4. Salvar resultado
    print("\n[4/4] Salvando resultado...")

    resultado["resumo"] = {
        "total_clientes": total_clientes,
        "total_projetos": total_projetos,
        "total_secoes": total_secoes,
        "total_tarefas_importadas": total_tarefas,
        "erros": erros,
    }

    output = os.path.join(os.path.dirname(__file__), "asana_provisionamento_resultado.json")
    with open(output, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    # Resumo final
    print("\n" + "=" * 70)
    print("PROVISIONAMENTO CONCLUIDO!")
    print("=" * 70)
    print(f"\n  Clientes provisionados: {total_projetos}/{total_clientes}")
    print(f"  Projetos criados: {total_projetos}")
    print(f"  Secoes criadas: {total_secoes}")
    print(f"  Tarefas importadas do Trello: {total_tarefas}")
    if erros:
        print(f"\n  ERROS ({len(erros)}):")
        for e in erros:
            print(f"    - {e}")
    print(f"\n  Resultado salvo em: asana_provisionamento_resultado.json")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
