#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
criar_portfolios.py
Cria 2 Portfolios (Starken e Alpha) para organizar os projetos
"""

import json
import time
import urllib.request
import urllib.error
import os

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"

# Carregamento dos GIDs
with open("asana_project_gids_completo.json", "r", encoding="utf-8") as f:
    project_gids = json.load(f)

WORKSPACE_GID = None

PORTFOLIOS_CONFIG = [
    {
        "nome": "Starken",
        "descricao": "Todos os projetos Starken Performance",
        "projetos": [
            "Starken | Conteudo & Design",
            "Starken | Hub dos Clientes",
            "Starken | Relatorios",
            "Starken | Cronogramas",
        ],
    },
    {
        "nome": "Alpha",
        "descricao": "Todos os projetos Alpha Assessoria",
        "projetos": [
            "Alpha | Conteudo & Design",
            "Alpha | Hub dos Clientes",
            "Alpha | Relatorios",
            "Alpha | Cronogramas",
        ],
    },
]


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


def get_workspace():
    result = asana_request("GET", "/users/me?opt_fields=workspaces.name,workspaces.gid")
    if result and result.get("data"):
        workspaces = result["data"].get("workspaces", [])
        if workspaces:
            ws = workspaces[0]
            print(f"Workspace detectado: {ws['name']} ({ws['gid']})")
            return ws["gid"]
    return None


def main():
    global WORKSPACE_GID

    print("=" * 70)
    print("CRIANDO PORTFOLIOS")
    print("=" * 70)

    print("\nDetectando workspace...", end=" ", flush=True)
    WORKSPACE_GID = get_workspace()
    if not WORKSPACE_GID:
        print("ERRO")
        return

    portfolios_criados = {}

    for config in PORTFOLIOS_CONFIG:
        print(f"\nCriando Portfolio: {config['nome']}...", end=" ", flush=True)

        # Criar portfolio
        result = asana_request("POST", "/portfolios", {
            "name": config["nome"],
            "workspace": WORKSPACE_GID,
        })

        if not result or not result.get("data"):
            print("ERRO")
            continue

        portfolio_gid = result["data"]["gid"]
        portfolios_criados[config["nome"]] = portfolio_gid
        print(f"OK ({portfolio_gid})")

        # Adicionar projetos ao portfolio
        for proj_nome in config["projetos"]:
            proj_gid = project_gids.get(proj_nome)
            if not proj_gid:
                print(f"  AVISO: Projeto nao encontrado: {proj_nome}")
                continue

            add_result = asana_request(
                "POST",
                f"/portfolios/{portfolio_gid}/addItem",
                {"item": proj_gid},
            )

            if add_result and add_result.get("data"):
                print(f"  + Adicionado: {proj_nome}")
            else:
                print(f"  - Erro ao adicionar: {proj_nome}")

            time.sleep(0.2)

    # Salvar resultado
    with open("asana_portfolios.json", "w", encoding="utf-8") as f:
        json.dump(portfolios_criados, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print("CONCLUIDO!")
    print(f"  Portfolios criados: {len(portfolios_criados)}")
    print(f"  GIDs salvos em: asana_portfolios.json")
    print("=" * 70)


if __name__ == "__main__":
    main()
