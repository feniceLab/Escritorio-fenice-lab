#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
criar_space_hubs.py
Cria 2 projetos-hub (Starken e Alpha) com seções que linkam para os projetos reais
"""

import json
import time
import urllib.request
import urllib.error
import os

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"
WORKSPACE_GID = None

# Carrega GIDs dos projetos reais
with open("asana_project_gids_completo.json", "r", encoding="utf-8") as f:
    project_gids = json.load(f)

SPACES_CONFIG = [
    {
        "nome": "Starken",
        "cor": "light-blue",
        "secoes": [
            {"nome": "Conteudo & Design", "projeto": "Starken | Conteudo & Design"},
            {"nome": "Hub dos Clientes", "projeto": "Starken | Hub dos Clientes"},
            {"nome": "Relatorios", "projeto": "Starken | Relatorios"},
            {"nome": "Cronogramas", "projeto": "Starken | Cronogramas"},
        ],
    },
    {
        "nome": "Alpha",
        "cor": "light-green",
        "secoes": [
            {"nome": "Conteudo & Design", "projeto": "Alpha | Conteudo & Design"},
            {"nome": "Hub dos Clientes", "projeto": "Alpha | Hub dos Clientes"},
            {"nome": "Relatorios", "projeto": "Alpha | Relatorios"},
            {"nome": "Cronogramas", "projeto": "Alpha | Cronogramas"},
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
        print(f"    ERRO {e.code}")
        return None
    except Exception as e:
        print(f"    ERRO: {e}")
        return None


def get_workspace():
    result = asana_request("GET", "/users/me?opt_fields=workspaces.gid")
    if result and result.get("data"):
        workspaces = result["data"].get("workspaces", [])
        if workspaces:
            return workspaces[0]["gid"]
    return None


def main():
    global WORKSPACE_GID

    print("=" * 70)
    print("CRIANDO SPACE-HUBS (Starken e Alpha)")
    print("=" * 70)

    print("\n[1/3] Detectando workspace...", end=" ", flush=True)
    WORKSPACE_GID = get_workspace()
    if not WORKSPACE_GID:
        print("ERRO")
        return
    print("OK")

    print("\n[2/3] Criando projetos-hub e secoes...")

    hubs_result = {}

    for space in SPACES_CONFIG:
        print(f"\n  {space['nome']}:")

        # Criar projeto Hub
        result = asana_request("POST", "/projects", {
            "name": space["nome"],
            "workspace": WORKSPACE_GID,
            "color": space["cor"],
            "default_view": "list",
        })

        if not result or not result.get("data"):
            print(f"    ERRO ao criar projeto")
            continue

        hub_gid = result["data"]["gid"]
        hubs_result[space["nome"]] = {
            "gid": hub_gid,
            "secoes": {},
        }
        print(f"    Projeto criado: {hub_gid}")

        time.sleep(0.2)

        # Criar seções
        for secao in space["secoes"]:
            secao_result = asana_request("POST", f"/projects/{hub_gid}/sections", {
                "name": secao["nome"],
            })

            if not secao_result or not secao_result.get("data"):
                print(f"      ERRO ao criar secao: {secao['nome']}")
                continue

            secao_gid = secao_result["data"]["gid"]
            hubs_result[space["nome"]]["secoes"][secao["nome"]] = secao_gid

            # Criar tarefa que aponta pro projeto real
            proj_gid = project_gids.get(secao["projeto"])
            if not proj_gid:
                print(f"      AVISO: Projeto nao encontrado: {secao['projeto']}")
                continue

            # Montar URL do projeto
            proj_url = f"https://app.asana.com/0/{proj_gid}/overview"

            task_result = asana_request("POST", "/tasks", {
                "name": f"Abrir: {secao['projeto']}",
                "projects": [hub_gid],
                "notes": f"Clique aqui para abrir o projeto:\n\n{proj_url}",
            })

            if task_result and task_result.get("data"):
                task_gid = task_result["data"]["gid"]
                # Mover task para a secao
                asana_request("POST", f"/sections/{secao_gid}/addTask", {
                    "task": task_gid,
                })
                print(f"      + {secao['nome']}")
            else:
                print(f"      - Erro ao criar tarefa: {secao['nome']}")

            time.sleep(0.2)

    # Salvar resultado
    with open("asana_space_hubs.json", "w", encoding="utf-8") as f:
        json.dump(hubs_result, f, indent=2, ensure_ascii=False)

    print("\n[3/3] Salvando configuracao...")
    print(f"  Arquivo: asana_space_hubs.json")

    print("\n" + "=" * 70)
    print("CONCLUIDO!")
    print(f"  Spaces criados: {len(hubs_result)}")
    print("\n  Estrutura no Asana:")
    print("  - Starken (com 4 secoes)")
    print("  - Alpha (com 4 secoes)")
    print("=" * 70)


if __name__ == "__main__":
    main()
