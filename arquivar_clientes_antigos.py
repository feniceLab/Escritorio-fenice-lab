#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
arquivar_clientes_antigos.py
Arquiva TODOS os projetos que nao sao da estrutura final
"""

import json
import time
import urllib.request
import urllib.error

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"
WORKSPACE_GID = "1213720645962721"

# Apenas estes 8 projetos devem ficar VISIBLES
PROJETOS_MANTER = {
    "Starken | Conteudo & Design",
    "Starken | Hub dos Clientes",
    "Starken | Relatorios",
    "Starken | Cronogramas",
    "Alpha | Conteudo & Design",
    "Alpha | Hub dos Clientes",
    "Alpha | Relatorios",
    "Alpha | Cronogramas",
}


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
        return None
    except Exception as e:
        return None


def main():
    print("=" * 70)
    print("ARQUIVANDO TODOS OS PROJETOS ANTIGOS")
    print("=" * 70)

    print("\nListando projetos...", end=" ", flush=True)
    result = asana_request("GET", f"/workspaces/{WORKSPACE_GID}/projects?limit=100")
    if not result or not result.get("data"):
        print("ERRO")
        return
    print("OK")

    projetos = result["data"]
    print(f"Total: {len(projetos)}")

    # Arquivar tudo que nao esta em PROJETOS_MANTER
    projetos_arquivar = [p for p in projetos if p.get("name") not in PROJETOS_MANTER]

    print(f"\nManter: {len(PROJETOS_MANTER)}")
    print(f"Arquivar: {len(projetos_arquivar)}\n")

    arquivados = 0
    for proj in projetos_arquivar:
        nome = proj.get("name", "")
        gid = proj.get("gid", "")

        result = asana_request("PUT", f"/projects/{gid}", {"archived": True})
        if result and result.get("data"):
            arquivados += 1
            nome_safe = nome.encode("ascii", "replace").decode("ascii")
            print(f"  [{arquivados}] {nome_safe}")
        else:
            nome_safe = nome.encode("ascii", "replace").decode("ascii")
            print(f"  [X] {nome_safe}")

        time.sleep(0.2)

    print("\n" + "=" * 70)
    print(f"CONCLUIDO! {arquivados} projetos arquivados")
    print("=" * 70)


if __name__ == "__main__":
    main()
