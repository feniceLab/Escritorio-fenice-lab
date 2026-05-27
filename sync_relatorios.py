"""
SINCRONIZADOR DE RELATÓRIOS — Detecta PDFs gerados nas pastas de clientes
e cria um arquivo JSON para importar no checklist.

Uso: python sync_relatorios.py
"""

import os
import json
import re
from datetime import datetime

# Caminho base dos clientes
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ASSESSORIA', 'CLIENTES')
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'relatorios-detectados.json')

MESES = {
    '01_JANEIRO': ('01', 'Janeiro'),
    '02_FEVEREIRO': ('02', 'Fevereiro'),
    '03_MARCO': ('03', 'Março'),
    '04_ABRIL': ('04', 'Abril'),
    '05_MAIO': ('05', 'Maio'),
    '06_JUNHO': ('06', 'Junho'),
    '07_JULHO': ('07', 'Julho'),
    '08_AGOSTO': ('08', 'Agosto'),
    '09_SETEMBRO': ('09', 'Setembro'),
    '10_OUTUBRO': ('10', 'Outubro'),
    '11_NOVEMBRO': ('11', 'Novembro'),
    '12_DEZEMBRO': ('12', 'Dezembro'),
}

def folder_to_client_name(folder_name):
    """Converte nome de pasta em nome legível: Mestre_do_Frango_Passo_Fundo → Mestre do Frango Passo Fundo"""
    return folder_name.replace('_', ' ')

def extract_period_from_filename(filename):
    """Tenta extrair período do nome do arquivo (ex: RELATORIO_PDN_20260303_20260315.pdf)"""
    match = re.search(r'(\d{8})_(\d{8})', filename)
    if match:
        start = match.group(1)
        end = match.group(2)
        try:
            d1 = datetime.strptime(start, '%Y%m%d').strftime('%d/%m/%Y')
            d2 = datetime.strptime(end, '%Y%m%d').strftime('%d/%m/%Y')
            return f'{d1} a {d2}'
        except ValueError:
            pass
    return None

def scan_clients():
    """Varre pastas de clientes e detecta PDFs gerados."""
    reports = []

    for company_folder in ['ALPHA', 'STARKEN']:
        company_path = os.path.join(BASE_DIR, company_folder)
        if not os.path.isdir(company_path):
            continue

        company = 'Alpha' if company_folder == 'ALPHA' else 'Starken'

        for client_folder in os.listdir(company_path):
            if client_folder.startswith('_') or client_folder.startswith('.'):
                continue

            client_path = os.path.join(company_path, client_folder)
            if not os.path.isdir(client_path):
                continue

            client_name = folder_to_client_name(client_folder)

            # Percorre anos
            for year_folder in os.listdir(client_path):
                year_path = os.path.join(client_path, year_folder)
                if not os.path.isdir(year_path) or not year_folder.isdigit():
                    continue

                year = year_folder

                # Percorre meses
                for month_folder in os.listdir(year_path):
                    month_path = os.path.join(year_path, month_folder)
                    if not os.path.isdir(month_path):
                        continue

                    mes_info = MESES.get(month_folder)
                    if not mes_info:
                        continue

                    mes_num, mes_nome = mes_info

                    # Busca PDFs
                    for filename in os.listdir(month_path):
                        if not filename.lower().endswith('.pdf'):
                            continue

                        filepath = os.path.join(month_path, filename)
                        file_stat = os.stat(filepath)
                        created_at = datetime.fromtimestamp(file_stat.st_mtime).isoformat()

                        # Tenta extrair período do nome do arquivo
                        period_from_name = extract_period_from_filename(filename)

                        reports.append({
                            'clientName': client_name,
                            'company': company,
                            'filename': filename,
                            'filepath': filepath,
                            'year': year,
                            'month': mes_num,
                            'monthName': mes_nome,
                            'periodLabel': f'{mes_nome} {year}',
                            'periodFromFilename': period_from_name,
                            'fileDate': created_at,
                            'fileSize': file_stat.st_size,
                        })

    return reports

def main():
    print('Varrendo pastas de clientes...')
    reports = scan_clients()

    output = {
        'generatedAt': datetime.now().isoformat(),
        'totalReports': len(reports),
        'reports': reports,
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'Encontrados {len(reports)} relatório(s) em PDF.')
    for r in reports:
        period = r['periodFromFilename'] or r['periodLabel']
        print(f'  [{r["company"]}] {r["clientName"]} — {period} — {r["filename"]}')

    print(f'\nArquivo salvo: {OUTPUT_FILE}')
    print('Abra o checklist e clique em "Sincronizar" para importar.')

if __name__ == '__main__':
    main()
