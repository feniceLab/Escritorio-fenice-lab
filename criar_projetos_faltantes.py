#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
criar_projetos_faltantes.py
Cria os 4 projetos que faltam: Relatorios e Cronogramas (Starken + Alpha)
"""

import json
import time
import urllib.request
import urllib.error
import os

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"
WORKSPACE_GID = None

PROJETOS_CRIAR = [
    {
        "nome": "Starken | Relatorios",
        "descricao": "Relatorios semanais e mensais de clientes",
        "cor": "light-blue",
    },
    {
        "nome": "Starken | Cronogramas",
        "descricao": "Cronogramas de publicacao semanal/mensal",
        "cor": "light-blue",
    },
    {
        "nome": "Alpha | Relatorios",
        "descricao": "Relatorios semanais e mensais de clientes",
        "cor": "light-green",
    },
    {
        "nome": "Alpha | Cronogramas",
        "descricao": "Cronogramas de publicacao semanal/mensal",
        "cor": "light-green",
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
    result = asana_request("GET", "/users/me?opt_fields=workspaces.name")
    if result and result.get("data"):
        workspaces = result["data"].get("workspaces", [])
        if workspaces:
            return workspaces[0]["gid"]
    return None


def main():
    global WORKSPACE_GID

    print("=" * 70)
    print("CRIANDO PROJETOS FALTANTES")
    print("=" * 70)

    print("\nDetectando workspace...", end=" ", flush=True)
    WORKSPACE_GID = get_workspace()
    if not WORKSPACE_GID:
        print("ERRO")
        return
    print(f"OK ({WORKSPACE_GID})")

    projetos_criados = {}

    for proj in PROJETOS_CRIAR:
        print(f"\nCriando: {proj['nome']}...", end=" ", flush=True)

        result = asana_request("POST", "/projects", {
            "name": proj["nome"],
            "description": proj["descricao"],
            "workspace": WORKSPACE_GID,
            "color": proj["cor"],
            "default_view": "list",
        })

        if result and result.get("data"):
            gid = result["data"]["gid"]
            projetos_criados[proj["nome"]] = gid
            print(f"OK ({gid})")
        else:
            print("ERRO")

        time.sleep(0.3)

    # Salvar GIDs
    with open("asana_project_gids_completo.json", "r", encoding="utf-8") as f:
        all_gids = json.load(f)

    all_gids.update(projetos_criados)

    with open("asana_project_gids_completo.json", "w", encoding="utf-8") as f:
        json.dump(all_gids, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print("CONCLUIDO!")
    print(f"  Projetos criados: {len(projetos_criados)}")
    print(f"  GIDs salvos em: asana_project_gids_completo.json")
    print("=" * 70)


if __name__ == "__main__":
    main()
