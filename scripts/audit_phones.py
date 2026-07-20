#!/usr/bin/env python3
"""Audit facility_site_v2 + facility_site phones:
- Drop phones that look invalid (too short, wrong format)
- Drop phones that are spread across unrelated facilities (token collision false-positive)
- Keep only phones where the facility name has a STRONG match with the URL domain
"""
import json
import re
import psycopg2
from collections import Counter, defaultdict
from datetime import datetime

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")
CACHE_FILE = "/opt/dmd/scripts/phones/sites_cache.json"
LOG_FILE = "/opt/dmd/logs/audit_phones_" + datetime.utcnow().strftime("%Y%m%d") + ".log"

def log(msg):
    line = f"[{datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def domain_tokens(url):
    m = re.search(r"https?://(?:www\.)?([^/]+)", url)
    if not m: return []
    host = m.group(1).lower()
    parts = host.split(".")
    # Use full main domain (parts[0] or last-1)
    out = set()
    if len(parts) >= 2:
        out.add(parts[0])  # e.g. "alkhairdental"
        out.add(parts[-2])  # e.g. "com" (skip)
    # Also full host
    return [t for t in out if t and t not in {"com","ae","net","org","co","io","biz"}]

def main():
    log("=== Phone audit ===")
    cache = json.load(open(CACHE_FILE))
    url_to_phones = {}
    for url, info in cache.items():
        if info.get("status") == 200 and info.get("phones"):
            # Pick best phone
            phones = sorted(info["phones"], key=lambda p: (len(re.sub(r"\D","",p)), p))
            url_to_phones[url] = phones[0]
    log(f"  URLs with phones: {len(url_to_phones)}")

    # Validate: each URL has a phone, we need to know which facilities SHOULD have it
    # Strong match: facility_name contains the main domain token
    url_strong_match = {}  # url -> list of facility_names (strong match only)
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT facility_name FROM dmd.professional WHERE facility_name IS NOT NULL")
    db_facs = [r[0] for r in cur.fetchall()]
    log(f"  DB facilities: {len(db_facs)}")

    for url, phone in url_to_phones.items():
        dts = domain_tokens(url)
        strong = []
        for fac in db_facs:
            f_low = fac.lower()
            for dt in dts:
                if len(dt) >= 5 and dt in f_low:
                    strong.append(fac)
                    break
        url_strong_match[url] = (phone, strong)

    # Show stats
    matched_urls = sum(1 for u,(p,s) in url_strong_match.items() if s)
    log(f"  URLs with strong match: {matched_urls} / {len(url_to_phones)}")
    for url, (phone, strong) in list(url_strong_match.items())[:15]:
        log(f"    {url[:50]:50s} -> {phone}  | {len(strong)} facilities")

    # For each (phone, facility) that has a strong match, count pros in that facility
    # We want to KEEP only the rows that match a strong facility
    # But facility_site_v2 is too broad — it filled in the phone on ALL matching facilities (incl weak).
    # Strategy: recompute the allowed set per URL: only strong-matched facilities get the phone.
    # Then for facility_site_v2 rows: re-evaluate. If facility not in strong match, NULL the phone.
    # If it IS in strong match, keep the phone but downgrade source to facility_site_strong.

    keep = set()  # (phone, facility_name) pairs to KEEP
    for url, (phone, strong_facs) in url_strong_match.items():
        for fac in strong_facs:
            keep.add((phone, fac))

    log(f"  Strong keep pairs: {len(keep)}")

    # Now check facility_site_v2 rows
    cur.execute("SELECT dha_unique_id, phone, facility_name FROM dmd.professional WHERE phone_source = 'facility_site_v2'")
    rows = cur.fetchall()
    log(f"  facility_site_v2 rows: {len(rows)}")
    null_count = 0
    downgrade_count = 0
    for uid, phone, fac in rows:
        if not fac:
            # No facility — likely false positive, null
            cur.execute("UPDATE dmd.professional SET phone = NULL, phone_source = NULL, phone_verified_at = NULL WHERE dha_unique_id = %s", (uid,))
            null_count += 1
            continue
        if (phone, fac) in keep:
            cur.execute("UPDATE dmd.professional SET phone_source = 'facility_site_strong' WHERE dha_unique_id = %s", (uid,))
            downgrade_count += 1
        else:
            # Check if this (phone, fac) was set by facility_site_v2 — if fac is strong match for ANY url, keep
            # Else, NULL
            # Simpler: if the facility is in any strong match list, keep; else null
            any_strong = any(fac == f for url,(p,s) in url_strong_match.items() for f in s)
            if not any_strong:
                cur.execute("UPDATE dmd.professional SET phone = NULL, phone_source = NULL, phone_verified_at = NULL WHERE dha_unique_id = %s", (uid,))
                null_count += 1

    conn.commit()
    log(f"  Nulled: {null_count}, downgraded to facility_site_strong: {downgrade_count}")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    log("  === Final state after audit ===")
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
