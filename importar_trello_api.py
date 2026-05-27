"""
Import Trello data into client_hub via Starken OS API (hub_upsert).
Uses the existing Vercel endpoint - no Supabase key needed.
Run: python importar_trello_api.py
"""
import json, sys, urllib.request, urllib.error, re, time

sys.stdout.reconfigure(encoding='utf-8')

# Use the LIVE Vercel API
API_URL = 'https://starken-os.vercel.app/api/asana/tasks'

TRELLO_FILE = 'Exportacao Trello/8kSs8AcB - starken-alpha.json'
SKIP_LISTS = ['DEMANDAS HENRIQUE', 'CRONOGRAMAS P ENVIAR']

def slugify(text):
    text = text.lower().strip()
    text = text.replace("'", "").replace("\u2019", "")
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

def extract_urls(text):
    return re.findall(r'https?://[^\s\)\]"<>]+', text or '')

def parse_client_list(list_name, cards):
    if list_name in SKIP_LISTS:
        return None
    if 'STARKEN |' not in list_name and 'ALPHA |' not in list_name:
        return None

    tenant = 'starken' if 'STARKEN |' in list_name else 'alpha'

    raw = list_name.split('|', 1)[1].strip() if '|' in list_name else list_name
    resp_match = re.search(r'\((\w+)\)', raw)
    resp_name = resp_match.group(1) if resp_match else None
    clean = re.sub(r'\s*\([^)]*\)\s*', ' ', raw).strip()
    # Remove extra descriptions like "Planejamento, execucao e BM"
    clean = re.sub(r'\s+Planejamento.*$', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s+', ' ', clean).strip()

    # Proper title case
    words_upper = ['JPR', 'BM', 'X']
    def title_word(w):
        if w.upper() in words_upper:
            return w.upper()
        return w.capitalize()

    if clean == clean.upper():
        client_name = ' '.join(title_word(w) for w in clean.split())
    else:
        client_name = clean

    status = 'standby' if 'STANDBY' in list_name.upper() else 'ativo'

    resp_map = {'BRUNA': 'Henrique', 'EMILLY': 'Emily', 'MARINA': 'Juan'}
    responsible = resp_map.get((resp_name or '').upper(), 'Juan')

    social_links = {}
    drive_url = None
    approval_url = None
    logo_url = None
    website_url = None
    package = None
    notes_parts = []

    for card in cards:
        name_upper = card['name'].upper().strip()
        desc = card.get('desc', '') or ''
        urls = extract_urls(desc)

        if name_upper in ('ACESSOS', 'ACESSO'):
            for url in urls:
                u = url.rstrip('/')
                if 'instagram.com' in url:
                    social_links['instagram'] = u
                elif 'facebook.com' in url:
                    social_links['facebook'] = u
                elif 'tiktok.com' in url:
                    social_links['tiktok'] = u
                elif 'linkedin.com' in url:
                    social_links['linkedin'] = u
                elif 'youtube.com' in url:
                    social_links['youtube'] = u
                elif not website_url and 'drive.google' not in url and 'trello.com' not in url and 'canva.com' not in url:
                    website_url = url

        elif 'LINK DRIVE' in name_upper or name_upper == 'DRIVE':
            for url in urls:
                if 'drive.google' in url:
                    drive_url = url
                    break

        elif 'APROVA' in name_upper:
            for url in urls:
                if 'canva.com' in url:
                    approval_url = url
                    break
            if not approval_url:
                for url in urls:
                    if 'trello.com' not in url and 'drive.google' not in url:
                        approval_url = url
                        break

        elif name_upper == 'LOGO':
            if urls:
                logo_url = urls[0]

        elif ('FEED' in name_upper and 'SEMANA' in name_upper) or \
             ('ARTE' in name_upper and 'SEMANAL' in name_upper) or \
             ('FEED' in name_upper and 'STORIES' in name_upper and 'SEMANA' in name_upper):
            if not package:
                package = card['name'].strip()

        elif 'IDEIAS' in name_upper and desc:
            notes_parts.append(f"## Ideias de Postagens\n{desc[:500]}")

    slug = slugify(client_name)

    return {
        'client_slug': slug,
        'client_name': client_name,
        'tenant': tenant,
        'segment': 'Gastronomia',
        'responsible': responsible,
        'status': status,
        'contract_package': package,
        'website_url': website_url,
        'drive_folder_url': drive_url,
        'approval_url': approval_url,
        'logo_url': logo_url,
        'social_links': social_links if social_links else {},
        'notes': '\n\n'.join(notes_parts) if notes_parts else None,
    }


def upsert_via_api(client_data):
    """Call hub_upsert via the Vercel API endpoint"""
    payload = {
        'action': 'hub_upsert',
        'client_slug': client_data['client_slug'],
        'user': 'system-import',
        'data': {k: v for k, v in client_data.items() if v is not None}
    }

    body = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(API_URL, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read().decode('utf-8'))
        return True, result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return False, f"{e.code}: {error_body[:200]}"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 65)
    print("  IMPORTAÇÃO TRELLO → CLIENT HUB (via Starken OS API)")
    print("=" * 65)
    print()

    with open(TRELLO_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    lists = {l['id']: l['name'] for l in data.get('lists', [])}

    by_list = {}
    for card in data.get('cards', []):
        lid = card.get('idList')
        lname = lists.get(lid, 'UNKNOWN')
        if lname not in by_list:
            by_list[lname] = []
        by_list[lname].append(card)

    success = 0
    failed = 0
    skipped = 0

    for list_item in data.get('lists', []):
        lname = list_item['name']
        cards = by_list.get(lname, [])

        client = parse_client_list(lname, cards)
        if not client:
            skipped += 1
            continue

        ok, result = upsert_via_api(client)

        if ok:
            success += 1
            drive = '✅' if client.get('drive_folder_url') else '—'
            ig = '✅' if client.get('social_links', {}).get('instagram') else '—'
            pkg = (client.get('contract_package') or '—')[:25]
            print(f"  ✅ {client['client_name']:30s} | {client['tenant']:7s} | {client['responsible']:8s} | Drive:{drive} IG:{ig} | {pkg}")
        else:
            failed += 1
            print(f"  ❌ {client['client_name']:30s} | ERRO: {result}")

        # Small delay to avoid rate limits
        time.sleep(0.3)

    print()
    print("=" * 65)
    print(f"  ✅ {success} importados | ❌ {failed} erros | ⏭️ {skipped} ignorados")
    print("=" * 65)


if __name__ == '__main__':
    main()
