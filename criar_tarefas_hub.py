#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
criar_tarefas_hub.py
Cria tarefas padrao em cada secao de cliente nos projetos Hub
"""

import json
import time
import urllib.request
import urllib.error
import os

ASANA_PAT = "2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549"
ASANA_BASE = "https://app.asana.com/api/1.0"

# Projetos Hub
HUB_PROJECTS = {
    "Starken": "1213723134141124",
    "Alpha": "1213723818393248",
}

# Tarefas padrao para cada cliente no Hub
TAREFAS_PADRAO = [
    {
        "nome": "ACESSOS (Logins e Senhas)",
        "notas": "Credenciais de acesso:\n- Instagram:\n- Facebook:\n- Google Ads:\n- Meta Business:\n- Google Meu Negocio:\n- iFood (se aplicavel):\n- Outros:",
    },
    {
        "nome": "LINK DRIVE (Pasta do Cliente)",
        "notas": "Link da pasta Google Drive do cliente:\n\n[Inserir link aqui]",
    },
    {
        "nome": "LOGO / ASSETS",
        "notas": "Arquivos de identidade visual:\n- Logo PNG:\n- Logo vetorizada:\n- Paleta de cores:\n- Fontes:\n- Manual de marca:",
    },
    {
        "nome": "LINK APROVACAO DE CRONOGRAMA",
        "notas": "Link para aprovacao do cronograma semanal/mensal:\n\n[Inserir link aqui]",
    },
    {
        "nome": "ANDAMENTO DA SEMANA",
        "notas": "Status atual da semana:\n- Conteudo: \n- Trafego: \n- Criativos: \n- Pendencias:",
    },
    {
        "nome": "CONTRATO / PACOTE",
        "notas": "Informacoes do contrato:\n- Pacote contratado:\n- Valor mensal:\n- Data inicio:\n- Renovacao:\n- Servicos inclusos:",
    },
]

# Clientes Starken
CLIENTES_STARKEN = [
    "Rosa Mexicano Blumenau", "Rosa Mexicano Brusque", "Mortadella Blumenau",
    "Hamburgueria Feio", "Suprema Pizza", "Arena Gourmet",
    "Super X - Garuva", "Super X - Guaratuba", "Super X - Itapoa",
    "Madrugao - Centro", "Madrugao - Garcia", "Madrugao - Fortaleza",
    "Restaurante Oca", "Aseyori Restaurante", "Oklahoma Burger",
    "Pizzaria Super X", "Sr Salsicha", "The Garrison",
    "JPR Moveis Rusticos", "Estilo Tulipa", "Academia Sao Pedro",
    "New Service", "Melhor Visao", "Bengers", "Dommus Smart Home",
]

CLIENTES_ALPHA = [
    "Mestre do Frango", "Patricia Salgados", "Pizzaria do Nei",
    "Super Duper", "Sorveteria Maciel", "WorldBurguer",
    "Salfest", "Saporito Pizzaria", "D' Britos", "Fratellis Pizzaria",
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


def main():
    # Carregar secoes do Hub
    secoes_file = os.path.join(os.path.dirname(__file__), "asana_hub_sections.json")
    with open(secoes_file, "r", encoding="utf-8") as f:
        hub_sections = json.load(f)

    print("=" * 70)
    print("CRIANDO TAREFAS PADRAO NOS HUBS DOS CLIENTES")
    print("=" * 70)

    total_criadas = 0
    erros = []

    for empresa, project_gid in HUB_PROJECTS.items():
        clientes = CLIENTES_STARKEN if empresa == "Starken" else CLIENTES_ALPHA
        print(f"\n=== {empresa.upper()} ({len(clientes)} clientes) ===")

        for i, cliente in enumerate(clientes, 1):
            section_gid = hub_sections.get(cliente)
            if not section_gid:
                erros.append(f"Secao nao encontrada: {cliente}")
                print(f"  [{i}/{len(clientes)}] {cliente} - SECAO NAO ENCONTRADA")
                continue

            print(f"  [{i}/{len(clientes)}] {cliente}...", end=" ", flush=True)

            tarefas_ok = 0
            for tarefa in TAREFAS_PADRAO:
                result = asana_request("POST", "/tasks", {
                    "name": tarefa["nome"],
                    "notes": tarefa["notas"],
                    "projects": [project_gid],
                })
                if result and result.get("data"):
                    task_gid = result["data"]["gid"]
                    # Mover para a secao do cliente
                    asana_request("POST", f"/sections/{section_gid}/addTask", {
                        "task": task_gid,
                    })
                    tarefas_ok += 1
                    total_criadas += 1
                else:
                    erros.append(f"Erro tarefa '{tarefa['nome']}' em {cliente}")

                time.sleep(0.2)  # Rate limiting

            print(f"{tarefas_ok}/{len(TAREFAS_PADRAO)} tarefas")

    print(f"\n{'=' * 70}")
    print(f"CONCLUIDO!")
    print(f"  Tarefas criadas: {total_criadas}")
    if erros:
        print(f"  Erros ({len(erros)}):")
        for e in erros:
            print(f"    - {e}")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
