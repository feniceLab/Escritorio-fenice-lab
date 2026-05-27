#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
limpar_projetos_antigos.py
Deleta os projetos duplicados/antigos que nao fazem parte da estrutura final
"""

import json
import time
import urllib.request
import urllib.error

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"
WORKSPACE_GID = "1213720645962721"

# Projetos que devem ser MANTIDOS (estrutura final)
PROJETOS_MANTER = {
    "Starken",
    "Alpha",
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
    print("LIMPEZA DE PROJETOS ANTIGOS/DUPLICADOS")
    print("=" * 70)

    # 1. Listar todos os projetos
    print("\n[1/3] Listando todos os projetos...", end=" ", flush=True)
    result = asana_request("GET", f"/workspaces/{WORKSPACE_GID}/projects?limit=100")
    if not result or not result.get("data"):
        print("ERRO ao listar projetos")
        return
    print("OK")

    projetos = result["data"]
    print(f"  Total encontrado: {len(projetos)}")

    # 2. Identificar projetos a deletar
    print("\n[2/3] Identificando projetos a deletar...")
    projetos_deletar = []
    projetos_manter = []

    for proj in projetos:
        nome = proj.get("name", "")
        gid = proj.get("gid", "")

        if nome in PROJETOS_MANTER:
            projetos_manter.append((nome, gid))
        else:
            projetos_deletar.append((nome, gid))

    print(f"  Manter: {len(projetos_manter)}")
    for nome, gid in sorted(projetos_manter):
        print(f"    + {nome}")

    print(f"\n  Deletar: {len(projetos_deletar)}")
    for nome, gid in sorted(projetos_deletar):
        print(f"    - {nome}")

    # 3. Deletar projetos
    print("\n[3/3] Deletando projetos antigos...")

    deletados = 0
    erros = []

    for nome, gid in projetos_deletar:
        result = asana_request("DELETE", f"/projects/{gid}")
        if result is None:
            deletados += 1
            print(f"  Deletado: {nome}")
        else:
            erros.append(nome)
            print(f"  ERRO: {nome}")

        time.sleep(0.3)

    print("\n" + "=" * 70)
    print("CONCLUIDO!")
    print(f"  Projetos deletados: {deletados}/{len(projetos_deletar)}")
    if erros:
        print(f"  Erros ({len(erros)}):")
        for e in erros:
            print(f"    - {e}")
    print(f"\n  Menu Asana agora tem apenas {len(projetos_manter)} projetos")
    print("=" * 70)


if __name__ == "__main__":
    main()
