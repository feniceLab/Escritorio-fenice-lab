"""
importar_trello_client_hub.py

Reads the Trello board export JSON and generates SQL INSERT statements
to populate the client_hub table in Supabase.

Usage:
    python importar_trello_client_hub.py
"""

import io
import json
import re
import sys
import unicodedata
from pathlib import Path

# Force UTF-8 output on Windows consoles that default to cp1252
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TRELLO_JSON_PATH = Path(r"C:\Users\Juan\Documents\GitHub\starken-performance\Exportacao Trello\8kSs8AcB - starken-alpha.json")
OUTPUT_SQL_PATH = Path(r"C:\Users\Juan\Documents\GitHub\starken-performance\SQL_CLIENT_HUB_IMPORT.sql")

# Lists that are not client boards
SKIP_LISTS = {"DEMANDAS HENRIQUE", "CRONOGRAMAS P ENVIAR"}

# Responsible name mapping: names found in parentheses → valid system users
RESPONSIBLE_MAP = {
    "BRUNA": "Henrique",
    "MARINA": "Juan",
    "EMILLY": "Emily",
    "EMILY": "Emily",
}

# Segment inference: keyword in list name → segment label
SEGMENT_MAP = {
    "PIZZA": "Gastronomia",
    "BURGER": "Gastronomia",
    "HAMBURGUER": "Gastronomia",
    "RESTAURANTE": "Gastronomia",
    "SUSHI": "Gastronomia",
    "LANCH": "Gastronomia",
    "SALGADO": "Gastronomia",
    "GOURMET": "Gastronomia",
    "CHURRASCARIA": "Gastronomia",
    "FRANGO": "Gastronomia",
    "PETISCOS": "Gastronomia",
    "MORTADELLA": "Gastronomia",
    "ROSA MEXICANO": "Gastronomia",
    "SALFEST": "Gastronomia",
    "SUPER DUPER": "Gastronomia",
    "FRATELLI": "Gastronomia",
    "SAPORITO": "Gastronomia",
    "WORLD BURGER": "Gastronomia",
    "SUPER X": "Gastronomia",
    "MADRUGAO": "Gastronomia",
    "MADRUGÃO": "Gastronomia",
    "ASEYORI": "Gastronomia",
    "ARENA": "Gastronomia",
    "OCA": "Gastronomia",
    "ACADEMIA": "Academia",
    "MOVEIS": "Movelaria",
    "MÓVEIS": "Movelaria",
    "RUSTICO": "Movelaria",
    "RÚSTICO": "Movelaria",
    "VISAO": "Saúde",
    "VISÃO": "Saúde",
    "NEW SERVICE": "Indústria",
    "QUIMICA": "Indústria",
    "QUÍMICA": "Indústria",
    "WHERE2GO": "Turismo",
    "PAIAGUAS": "Gastronomia",
    "PAIAGUÁS": "Gastronomia",
}

# Social URL domain → key in social_links JSON
SOCIAL_DOMAIN_MAP = {
    "instagram.com": "instagram",
    "facebook.com": "facebook",
    "tiktok.com": "tiktok",
    "twitter.com": "twitter",
    "x.com": "twitter",
    "linkedin.com": "linkedin",
    "youtube.com": "youtube",
}

# Non-social URL domains to skip when looking for website_url
SKIP_URL_DOMAINS = {
    "drive.google.com",
    "docs.google.com",
    "canva.com",
    "trello.com",
    "whatsapp.com",
    "api.whatsapp.com",
    "mailto:",
    "google.com/search",
    "google.com/maps",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Convert a string to a URL-friendly slug."""
    # Normalize unicode (e.g. accented characters -> base + combining)
    normalized = unicodedata.normalize("NFKD", text)
    # Keep only ASCII characters
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    # Remove apostrophes and single quotes before general substitution
    # so "FRATELLI'S" becomes "fratellis" not "fratelli-s"
    ascii_text = ascii_text.replace("'", "").replace("`", "")
    # Lowercase
    ascii_text = ascii_text.lower()
    # Replace non-alphanumeric characters with hyphens
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    # Strip leading/trailing hyphens
    return ascii_text.strip("-")


def title_case_pt(text: str) -> str:
    """
    Convert an uppercase Brazilian Portuguese string to title case,
    keeping common lowercase connectors in lowercase.
    """
    lowercase_words = {"de", "da", "do", "das", "dos", "e", "a", "o", "em", "com"}
    words = text.lower().split()
    result = []
    for i, word in enumerate(words):
        if i == 0 or word not in lowercase_words:
            result.append(word.capitalize())
        else:
            result.append(word)
    return " ".join(result)


def sql_escape(value: str) -> str:
    """Escape a string value for SQL (replace single quotes with two single quotes)."""
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_nullable(value: str | None) -> str:
    """Return SQL NULL or an escaped string."""
    if not value:
        return "NULL"
    return sql_escape(value)


def extract_urls_from_markdown(text: str) -> list[str]:
    """
    Extract all HTTP/HTTPS URLs from a Trello markdown description.
    Handles both raw URLs and markdown link syntax [text](url).
    """
    if not text:
        return []
    # Markdown links: [label](url)
    md_urls = re.findall(r"\[(?:[^\]]*)\]\((https?://[^\s)]+)", text)
    # Raw URLs (not inside parentheses already captured)
    raw_urls = re.findall(r"(?<!\()https?://[^\s)\]\"]+", text)
    seen = set()
    result = []
    for url in md_urls + raw_urls:
        # Remove trailing punctuation artifacts
        url = url.rstrip(".,;)")
        if url not in seen:
            seen.add(url)
            result.append(url)
    return result


def classify_url(url: str) -> tuple[str, str]:
    """
    Classify a URL as ('social', platform_key) or ('website', '') or ('skip', '').
    """
    lower = url.lower()
    for domain, key in SOCIAL_DOMAIN_MAP.items():
        if domain in lower:
            return "social", key
    for skip_domain in SKIP_URL_DOMAINS:
        if skip_domain in lower:
            return "skip", ""
    return "website", ""


def parse_list_name(list_name: str) -> dict:
    """
    Parse a Trello list name into structured fields.

    Format examples:
      STARKEN | ROSA MEXICANO BLUMENAU
      ALPHA | SUPER DUPER (BRUNA)
      STARKEN | ACADEMIA SÃO PEDRO (EMILLY) Planejamento, execução e BM
      STARKEN | REALIZZATI MÓVEIS (STANDBY)
    """
    result = {
        "tenant": "starken",
        "raw_name": list_name,
        "client_name": "",
        "responsible": "Juan",
        "status": "ativo",
    }

    # Determine tenant
    if list_name.upper().startswith("ALPHA |"):
        result["tenant"] = "alpha"
        core = list_name[len("ALPHA |"):].strip()
    elif list_name.upper().startswith("STARKEN |"):
        result["tenant"] = "starken"
        core = list_name[len("STARKEN |"):].strip()
    else:
        core = list_name.strip()

    # Check for STANDBY status
    if "(STANDBY)" in core.upper():
        result["status"] = "standby"
        core = re.sub(r"\(STANDBY\)", "", core, flags=re.IGNORECASE).strip()

    # Extract responsible from parentheses (e.g. "(BRUNA)", "(EMILLY)")
    paren_match = re.search(r"\(([^)]+)\)", core)
    if paren_match:
        paren_value = paren_match.group(1).strip().upper()
        if paren_value in RESPONSIBLE_MAP:
            result["responsible"] = RESPONSIBLE_MAP[paren_value]
        # Remove the parentheses block from the core name
        core = core[:paren_match.start()].strip()

    # Remove trailing extra info after comma (e.g. "Planejamento, execução e BM")
    # Only if it looks like a description phrase (starts lowercase or has comma)
    comma_idx = core.find(",")
    if comma_idx > 0:
        after_comma = core[comma_idx + 1:].strip()
        # If the part after comma is all words (no pipe), trim it
        if "|" not in after_comma:
            core = core[:comma_idx].strip()

    # Clean up any trailing extra phrases separated by space that look like
    # sentences (e.g. "Planejamento execução e BM") — detect by lowercase start
    # after the main all-caps name
    # Strategy: take the last contiguous all-caps segment
    parts = core.split()
    clean_parts = []
    for part in parts:
        # Keep parts that are mostly uppercase or numbers/special chars
        upper_ratio = sum(1 for c in part if c.isupper()) / max(len(part), 1)
        if upper_ratio >= 0.5 or not part[0].isalpha():
            clean_parts.append(part)
        else:
            break  # Stop at first lowercase-dominant word
    core = " ".join(clean_parts).strip() if clean_parts else core

    result["client_name"] = title_case_pt(core)
    return result


def infer_segment(list_name_upper: str) -> str:
    """Infer a segment label from the uppercase list name."""
    for keyword, segment in SEGMENT_MAP.items():
        if keyword in list_name_upper:
            return segment
    return "Gastronomia"


def infer_package(cards: list[dict]) -> str | None:
    """
    Find the contract package from card names.
    The package card typically looks like '2 FEED SEMANA + 7 STORIES' or
    '1 ARTE SEMANAL', '2 ARTES FEED SEMANA | 14 STORIES SEMANA', etc.
    """
    package_pattern = re.compile(
        r"^\d+\s+(FEED|ARTE|STORY|STORIES|ARTES)",
        re.IGNORECASE,
    )
    for card in cards:
        name = card["name"].strip()
        if package_pattern.match(name):
            return name
    return None


def parse_acessos_card(card: dict) -> dict:
    """
    Extract social_links dict and website_url from an ACESSOS card description.
    """
    social_links: dict[str, str] = {}
    website_url: str | None = None

    desc = card.get("desc", "") or ""
    urls = extract_urls_from_markdown(desc)

    for url in urls:
        kind, key = classify_url(url)
        if kind == "social":
            # Keep first occurrence per platform
            if key not in social_links:
                social_links[key] = url
        elif kind == "website" and website_url is None:
            website_url = url

    return {"social_links": social_links, "website_url": website_url}


def get_first_url_from_card(card: dict) -> str | None:
    """
    Return the first URL from a card, checking description first,
    then attachments. Skips trello.com attachment URLs for non-logo cards.
    """
    desc = card.get("desc", "") or ""
    urls = extract_urls_from_markdown(desc)
    if urls:
        return urls[0]
    attachments = card.get("attachments", []) or []
    if attachments:
        return attachments[0].get("url")
    return None


def get_logo_url_from_card(card: dict) -> str | None:
    """Return the first attachment URL from a LOGO card (trello.com URLs are valid here)."""
    attachments = card.get("attachments", []) or []
    if attachments:
        return attachments[0].get("url")
    desc = card.get("desc", "") or ""
    urls = extract_urls_from_markdown(desc)
    return urls[0] if urls else None


def get_drive_url_from_card(card: dict) -> str | None:
    """
    Extract a Google Drive URL from a LINK DRIVE card.
    Checks attachments first (common pattern), then desc.
    """
    attachments = card.get("attachments", []) or []
    for att in attachments:
        url = att.get("url", "")
        if "drive.google.com" in url:
            return url
    desc = card.get("desc", "") or ""
    urls = extract_urls_from_markdown(desc)
    for url in urls:
        if "drive.google.com" in url:
            return url
    return None


def collect_notes(cards: list[dict]) -> str | None:
    """
    Collect interesting notes from IDEIAS DE POSTAGENS, STORIES RECORRENTES, etc.
    Returns a combined text block or None if nothing found.
    """
    note_keywords = {"IDEIAS", "RECORRENTE", "HISTORICO", "HISTÓRICO", "BRIEFING", "OBSERV"}
    sections = []
    for card in cards:
        name_upper = card["name"].upper()
        if any(kw in name_upper for kw in note_keywords):
            desc = (card.get("desc") or "").strip()
            if desc:
                sections.append(f"## {card['name']}\n{desc}")
    return "\n\n".join(sections) if sections else None


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def parse_client_from_list(lst: dict, all_cards: list[dict]) -> dict:
    """Extract all client_hub fields from a Trello list and its cards."""
    list_id = lst["id"]
    cards = [c for c in all_cards if c["idList"] == list_id and not c.get("closed")]

    parsed = parse_list_name(lst["name"])
    list_name_upper = lst["name"].upper()

    # --- Slug ---
    slug = slugify(parsed["client_name"])

    # --- Segment ---
    segment = infer_segment(list_name_upper)

    # --- Package card ---
    contract_package = infer_package(cards)

    # --- ACESSOS card ---
    acessos_card = next(
        (c for c in cards if c["name"].upper().startswith("ACESS")), None
    )
    social_links: dict = {}
    website_url: str | None = None
    if acessos_card:
        acessos_data = parse_acessos_card(acessos_card)
        social_links = acessos_data["social_links"]
        website_url = acessos_data["website_url"]

    # --- LINK DRIVE card ---
    # Match "LINK DRIVE", "drive", "DRIVE" card names (some ALPHA clients use lowercase)
    drive_card = next(
        (
            c for c in cards
            if c["name"].upper().strip() in ("LINK DRIVE", "DRIVE")
            or "LINK DRIVE" in c["name"].upper()
        ),
        None,
    )
    drive_folder_url: str | None = None
    if drive_card:
        drive_folder_url = get_drive_url_from_card(drive_card)

    # --- LINK APROVAÇÃO card ---
    approval_card = next(
        (
            c for c in cards
            if "APROVAC" in c["name"].upper().replace("\u00c3", "A")
            or "APROVA" in c["name"].upper()
            or "APROVACAO" in c["name"].upper()
            or "CRONOGRAMA" in c["name"].upper()
        ),
        None,
    )
    approval_url: str | None = None
    if approval_card:
        # Collect all candidate URLs from desc and attachments
        candidate_urls: list[str] = []
        desc_urls = extract_urls_from_markdown(approval_card.get("desc", "") or "")
        att_urls = [a.get("url", "") for a in approval_card.get("attachments", [])]
        for url in desc_urls + att_urls:
            if url:
                candidate_urls.append(url)
        # Prefer Canva or Notion links (actual approval boards)
        # Skip trello.com downloads and google drive links
        for url in candidate_urls:
            if "canva.com" in url or "notion.so" in url:
                approval_url = url
                break
        # Fallback: use first non-trello, non-drive URL
        if approval_url is None:
            for url in candidate_urls:
                if "trello.com" not in url and "drive.google.com" not in url:
                    approval_url = url
                    break

    # --- LOGO card ---
    # Match "LOGO" or "logo" (case-insensitive exact match)
    logo_card = next(
        (c for c in cards if c["name"].strip().upper() == "LOGO"), None
    )
    logo_url: str | None = None
    if logo_card:
        logo_url = get_logo_url_from_card(logo_card)

    # --- Notes ---
    notes = collect_notes(cards)

    return {
        "client_slug": slug,
        "client_name": parsed["client_name"],
        "tenant": parsed["tenant"],
        "segment": segment,
        "responsible": parsed["responsible"],
        "status": parsed["status"],
        "contract_package": contract_package,
        "website_url": website_url,
        "drive_folder_url": drive_folder_url,
        "approval_url": approval_url,
        "logo_url": logo_url,
        "social_links": social_links,
        "notes": notes,
    }


# ---------------------------------------------------------------------------
# SQL generation
# ---------------------------------------------------------------------------

def social_links_to_sql_json(social_links: dict) -> str:
    """Render the social_links dict as a SQL-safe JSON string literal."""
    if not social_links:
        return "'{}'::jsonb"
    # Build JSON manually to avoid import issues with escaping
    parts = []
    for key, value in social_links.items():
        escaped_key = key.replace("'", "''").replace('"', '\\"')
        escaped_val = value.replace("'", "''").replace('"', '\\"')
        parts.append(f'"{escaped_key}": "{escaped_val}"')
    json_str = "{" + ", ".join(parts) + "}"
    return f"'{json_str}'::jsonb"


def generate_insert(client: dict) -> str:
    """Generate a single SQL INSERT ... ON CONFLICT DO UPDATE statement."""
    slug = sql_escape(client["client_slug"])
    name = sql_escape(client["client_name"])
    tenant = sql_escape(client["tenant"])
    segment = sql_escape(client["segment"])
    responsible = sql_escape(client["responsible"])
    status = sql_escape(client["status"])
    package = sql_nullable(client["contract_package"])
    website = sql_nullable(client["website_url"])
    drive = sql_nullable(client["drive_folder_url"])
    approval = sql_nullable(client["approval_url"])
    logo = sql_nullable(client["logo_url"])
    social = social_links_to_sql_json(client["social_links"])
    notes = sql_nullable(client["notes"])
    created_by = sql_escape("system-import")

    return f"""INSERT INTO client_hub (
    client_slug, client_name, tenant, segment, responsible, status,
    contract_package, website_url, drive_folder_url, approval_url, logo_url,
    social_links, notes, created_by
) VALUES (
    {slug},
    {name},
    {tenant},
    {segment},
    {responsible},
    {status},
    {package},
    {website},
    {drive},
    {approval},
    {logo},
    {social},
    {notes},
    {created_by}
)
ON CONFLICT (client_slug) DO UPDATE SET
    client_name      = EXCLUDED.client_name,
    tenant           = EXCLUDED.tenant,
    segment          = EXCLUDED.segment,
    responsible      = EXCLUDED.responsible,
    status           = EXCLUDED.status,
    contract_package = EXCLUDED.contract_package,
    website_url      = EXCLUDED.website_url,
    drive_folder_url = EXCLUDED.drive_folder_url,
    approval_url     = EXCLUDED.approval_url,
    logo_url         = EXCLUDED.logo_url,
    social_links     = EXCLUDED.social_links,
    notes            = EXCLUDED.notes,
    updated_at       = NOW();"""


# ---------------------------------------------------------------------------
# Summary printer
# ---------------------------------------------------------------------------

def print_summary(clients: list[dict]) -> None:
    """Print a human-readable summary of what was extracted per client."""
    print("=" * 72)
    print(f"  TRELLO -> CLIENT HUB IMPORT SUMMARY  ({len(clients)} clients)")
    print("=" * 72)

    starken_clients = [c for c in clients if c["tenant"] == "starken"]
    alpha_clients = [c for c in clients if c["tenant"] == "alpha"]

    for tenant_label, group in [("STARKEN", starken_clients), ("ALPHA", alpha_clients)]:
        print(f"\n--- {tenant_label} ({len(group)} clients) ---")
        for c in group:
            status_flag = " [STANDBY]" if c["status"] == "standby" else ""
            print(f"\n  {c['client_name']}{status_flag}")
            print(f"    slug        : {c['client_slug']}")
            print(f"    segment     : {c['segment']}")
            print(f"    responsible : {c['responsible']}")
            print(f"    package     : {c['contract_package'] or '(not found)'}")
            print(f"    instagram   : {c['social_links'].get('instagram', '(not found)')}")
            print(f"    facebook    : {c['social_links'].get('facebook', '(not found)')}")
            social_other = {k: v for k, v in c['social_links'].items() if k not in ('instagram', 'facebook')}
            if social_other:
                print(f"    other social: {social_other}")
            print(f"    website     : {c['website_url'] or '(not found)'}")
            print(f"    drive       : {c['drive_folder_url'] or '(not found)'}")
            print(f"    approval    : {c['approval_url'] or '(not found)'}")
            print(f"    logo        : {'(found)' if c['logo_url'] else '(not found)'}")
            print(f"    notes       : {'(found)' if c['notes'] else '(none)'}")

    print("\n" + "=" * 72)

    # Coverage stats
    total = len(clients)
    fields = [
        "contract_package", "website_url", "drive_folder_url",
        "approval_url", "logo_url",
    ]
    print("\n  FIELD COVERAGE")
    print(f"  {'Field':<22}  Found   Missing")
    print(f"  {'-'*22}  ------  -------")
    for field in fields:
        found = sum(1 for c in clients if c[field])
        print(f"  {field:<22}  {found:>4}/{total}   {total-found:>4}")
    ig_count = sum(1 for c in clients if c["social_links"].get("instagram"))
    fb_count = sum(1 for c in clients if c["social_links"].get("facebook"))
    print(f"  {'social_links.instagram':<22}  {ig_count:>4}/{total}   {total-ig_count:>4}")
    print(f"  {'social_links.facebook':<22}  {fb_count:>4}/{total}   {total-fb_count:>4}")
    print("=" * 72)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"Reading Trello export: {TRELLO_JSON_PATH}")
    with open(TRELLO_JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    all_lists = data.get("lists", [])
    all_cards = data.get("cards", [])

    # Filter to open, non-skip lists only
    client_lists = [
        lst for lst in all_lists
        if not lst.get("closed") and lst["name"] not in SKIP_LISTS
    ]

    print(f"Found {len(client_lists)} client lists to process.\n")

    clients = []
    for lst in client_lists:
        client = parse_client_from_list(lst, all_cards)
        clients.append(client)

    # Print summary to console
    print_summary(clients)

    # Generate SQL
    sql_lines = [
        "-- ================================================================",
        "-- CLIENT HUB IMPORT - generated from Trello export",
        "-- Source: 8kSs8AcB - starken-alpha.json",
        "-- Run with: psql -U postgres -d starken -f SQL_CLIENT_HUB_IMPORT.sql",
        "-- ================================================================",
        "",
        "BEGIN;",
        "",
    ]

    for client in clients:
        sql_lines.append(f"-- {client['client_name']} ({client['tenant']})")
        sql_lines.append(generate_insert(client))
        sql_lines.append("")

    sql_lines += ["COMMIT;", ""]

    sql_content = "\n".join(sql_lines)
    OUTPUT_SQL_PATH.write_text(sql_content, encoding="utf-8")
    print(f"\nSQL written to: {OUTPUT_SQL_PATH}")
    print(f"Total statements: {len(clients)}")


if __name__ == "__main__":
    main()
