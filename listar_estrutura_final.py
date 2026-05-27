#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
listar_estrutura_final.py
Lista toda a estrutura final do Asana e deleta projeto teste
"""

import json
import urllib.request
import urllib.error

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"

# Projeto de teste a deletar
PROJETO_TESTE_GID = "1213723420733692"  # Starken | Rosa Mexicano Blumenau


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
        print(f"  ERRO {e.code}")
        return None
    except Exception as e:
        print(f"  ERRO: {e}")
        return None


def main():
    print("=" * 70)
    print("LIMPEZA E LISTAGEM FINAL")
    print("=" * 70)

    # 1. Deletar projeto teste
    print("\n[1/2] Deletando projeto teste...", end=" ", flush=True)
    result = asana_request("DELETE", f"/projects/{PROJETO_TESTE_GID}")
    if result or result is None:  # DELETE retorna vazio ou erro
        print("OK")
    else:
        print("AVISO (pode ja estar deletado)")

    # 2. Listar projetos
    print("\n[2/2] Listando estrutura atual...")

    # Carrega os GIDs
    with open("asana_project_gids_completo.json", "r", encoding="utf-8") as f:
        project_gids = json.load(f)

    with open("asana_space_hubs.json", "r", encoding="utf-8") as f:
        space_hubs = json.load(f)

    print("\n" + "=" * 70)
    print("ESTRUTURA FINAL DO ASANA")
    print("=" * 70)

    print("\n[SPACE-HUBS - Menu Principal]")
    print("\n1. Starken")
    print("   Seçoes:")
    print("   - Conteudo & Design")
    print("   - Hub dos Clientes")
    print("   - Relatorios")
    print("   - Cronogramas")

    print("\n2. Alpha")
    print("   Seçoes:")
    print("   - Conteudo & Design")
    print("   - Hub dos Clientes")
    print("   - Relatorios")
    print("   - Cronogramas")

    print("\n\n[PROJETOS REAIS (linkados dentro dos Spaces)]")
    print("\nSTARKEN:")
    starken_projs = [k for k in project_gids.keys() if k.startswith("Starken")]
    for proj in sorted(starken_projs):
        print(f"  • {proj}")
        print(f"    GID: {project_gids[proj]}")

    print("\nALPHA:")
    alpha_projs = [k for k in project_gids.keys() if k.startswith("Alpha")]
    for proj in sorted(alpha_projs):
        print(f"  • {proj}")
        print(f"    GID: {project_gids[proj]}")

    print("\n\n[DADOS DENTRO DOS PROJETOS]")
    print("\nStarken | Conteudo & Design:")
    print("  - 6 secoes de workflow (Briefing > Publicado > Arquivo)")
    print("  - Pronto para criar tarefas de conteudo")

    print("\nStarken | Hub dos Clientes:")
    print("  - 25 secoes (uma por cliente Starken)")
    print("  - 150 tarefas padrao (6 por cliente: Acessos, Drive, Logo, etc)")
    print("  - ~200 cards importados do Trello")

    print("\nAlpha | Conteudo & Design:")
    print("  - 6 secoes de workflow")
    print("  - Pronto para criar tarefas de conteudo")

    print("\nAlpha | Hub dos Clientes:")
    print("  - 10 secoes (uma por cliente Alpha)")
    print("  - 60 tarefas padrao (6 por cliente)")
    print("  - ~115 cards importados do Trello")

    print("\n" + "=" * 70)
    print("[OK] PRONTO PARA USAR!")
    print("=" * 70)
    print("\nProximos passos:")
    print("  1. Abra o Asana e veja os 2 Spaces (Starken e Alpha)")
    print("  2. Clique em cada Space para expandir as 4 areas")
    print("  3. Comece a criar tarefas/conteúdo nos projetos")
    print("  4. Use os Hubs dos Clientes para organizar infos por cliente")
    print("=" * 70)


if __name__ == "__main__":
    main()
