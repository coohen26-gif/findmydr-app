#!/usr/bin/env python3
"""V2 site scraper: for each URL with phone, find all DB facilities whose name
contains a token from the URL domain, and propagate the phone to those pros.
"""
import json
import re
import psycopg2
from collections import Counter, defaultdict
from datetime import datetime

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")
CACHE_FILE = "/opt/dmd/scripts/phones/sites_cache.json"
LOG_FILE = "/opt/dmd/logs/scrape_sites_v2_" + datetime.utcnow().strftime("%Y%m%d") + ".log"

def log(msg):
    line = f"[{datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def domain_tokens(url):
    """Extract brand-like tokens from URL."""
    m = re.search(r"https?://(?:www\.)?([^/]+)", url)
    if not m: return []
    host = m.group(1).lower()
    # strip TLD
    parts = host.split(".")
    if len(parts) >= 2:
        # main domain part
        return [parts[0], parts[-2]] if len(parts) >= 2 else [parts[0]]
    return [host]

def main():
    log("=== V2 facility matching by domain ===")
    cache = json.load(open(CACHE_FILE))
    url_to_phones = {}
    for url, info in cache.items():
        if info.get("status") == 200 and info.get("phones"):
            url_to_phones[url] = info["phones"]
    log(f"  URLs with phones: {len(url_to_phones)}")

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    # Load all facility names from DB
    cur.execute("SELECT DISTINCT facility_name FROM dmd.professional WHERE facility_name IS NOT NULL AND phone IS NULL")
    facs = [r[0] for r in cur.fetchall()]
    log(f"  DB facilities without phone: {len(facs)}")

    # Build token->facilities index
    tok_index = defaultdict(set)
    for f in facs:
        # tokens from facility_name (words > 2 chars)
        words = re.findall(r"\b[a-z]{3,}\b", f.lower())
        for w in words:
            tok_index[w].add(f)
    log(f"  Token index: {len(tok_index)} tokens")

    updates = []
    matched_urls = 0
    fac_phones = Counter()
    for url, phones in url_to_phones.items():
        dts = domain_tokens(url)
        candidate_facs = set()
        for dt in dts:
            # direct match
            candidate_facs |= tok_index.get(dt, set())
            # substring match
            for w, fset in tok_index.items():
                if dt in w or w in dt:
                    candidate_facs |= fset
        if not candidate_facs:
            continue
        matched_urls += 1
        # Pick best phone
        phones_sorted = sorted(phones, key=lambda p: (len(re.sub(r"\D","",p)), p))
        best = phones_sorted[0]
        for fac in candidate_facs:
            cur.execute("SELECT dha_unique_id FROM dmd.professional WHERE facility_name = %s AND phone IS NULL", (fac,))
            uids = [r[0] for r in cur.fetchall()]
            for uid in uids:
                updates.append((best, "facility_site_v2", datetime.utcnow(), uid))
                fac_phones[fac] += 1

    log(f"  URLs matched to facilities: {matched_urls}")
    log(f"  Updates: {len(updates)}")
    log(f"  Facilities covered: {len(fac_phones)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    log(f"  Updated {cur.rowcount} rows")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    log("  Final state:")
    for s, c in cur.fetchall():
        log(f"    {s}: {c}")
    cur.execute("SELECT COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL")
    total = cur.fetchone()[0]
    log(f"  Total: {total} / 65589 = {100*total/65589:.2f}%")

    cur.close()
    conn.close()
    log("=== Done ===")

if __name__ == "__main__":
    main()
