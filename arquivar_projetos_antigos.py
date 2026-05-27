#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
arquivar_projetos_antigos.py
Arquiva (em vez de deletar) os projetos antigos/duplicados
"""

import json
import time
import urllib.request
import urllib.error

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"
WORKSPACE_GID = "1213720645962721"

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
    print("ARQUIVANDO PROJETOS ANTIGOS/DUPLICADOS")
    print("=" * 70)

    print("\n[1/2] Listando projetos...", end=" ", flush=True)
    result = asana_request("GET", f"/workspaces/{WORKSPACE_GID}/projects?limit=100")
    if not result or not result.get("data"):
        print("ERRO")
        return
    print("OK")

    projetos = result["data"]

    # Identifica duplicados (mesmo nome, varios GIDs)
    nomes_count = {}
    for proj in projetos:
        nome = proj.get("name", "")
        if nome not in nomes_count:
            nomes_count[nome] = []
        nomes_count[nome].append(proj.get("gid"))

    # Separa o que deletar
    projetos_arquivar = []
    for proj in projetos:
        nome = proj.get("name", "")
        gid = proj.get("gid", "")

        # Se eh duplicado (mesmo nome aparece 2+ vezes), manter apenas o primeiro
        if nome in nomes_count and len(nomes_count[nome]) > 1:
            if gid != nomes_count[nome][0]:  # Se nao eh o primeiro GID, arquiva
                projetos_arquivar.append((nome, gid))
                nomes_count[nome].remove(gid)  # Remove pra nao contar novamente
        # Se nao eh um projeto da estrutura final, arquiva
        elif nome not in PROJETOS_MANTER:
            projetos_arquivar.append((nome, gid))

    print(f"\n[2/2] Arquivando {len(projetos_arquivar)} projetos...")

    arquivados = 0
    erros = []

    for nome, gid in projetos_arquivar:
        result = asana_request("PUT", f"/projects/{gid}", {
            "archived": True,
        })
        if result and result.get("data"):
            arquivados += 1
            print(f"  Arquivado: {nome}")
        else:
            erros.append(nome)
            print(f"  ERRO: {nome}")

        time.sleep(0.2)

    print("\n" + "=" * 70)
    print("CONCLUIDO!")
    print(f"  Projetos arquivados: {arquivados}/{len(projetos_arquivar)}")
    if erros:
        print(f"  Erros ({len(erros)}):")
        for e in erros[:10]:
            print(f"    - {e}")
    print("\n  Dica: Projetos arquivados saem do menu, mas podem ser")
    print("  restaurados depois se necessario.")
    print("=" * 70)


if __name__ == "__main__":
    main()
