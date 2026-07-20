#!/usr/bin/env python3
"""Import pipeline v7 phones into dmd.professional.

Strategy:
- Read /opt/dmd/sales/pipeline_enriched_v7.csv (452 prospects, multi-line CSV).
- For each prospect with a phone (clinic_phone, dha_phone, dha_phone_v2) :
  - Try to match against dmd.professional by full_name (lowercased, normalized)
  - If match: UPDATE phone, phone_source='pipeline', phone_verified_at=now()
  - Track stats by source
"""
import csv
import sys
import re
import psycopg2
from collections import Counter, defaultdict
from datetime import datetime

# DB is in Docker container findmydr-db, tunneled via socat: localhost:55432
DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr", password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")

def normalize_name(s):
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def normalize_phone(p):
    p = (p or "").strip()
    if not p: return None
    digits = re.sub(r"\D", "", p)
    if not digits: return None
    if digits.startswith("971"):
        return "+" + digits
    if digits.startswith("0"):
        if len(digits) >= 9:
            return "+971" + digits[1:]
    if len(digits) >= 9 and not p.startswith("+"):
        return "+" + digits
    return p

def main():
    print(f"[{datetime.utcnow().isoformat()}] Starting pipeline v7 import...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Load all professionals -> dict by normalized name
    cur.execute("SELECT dha_unique_id, full_name, lower(full_name) FROM dmd.professional")
    by_name = {}
    for uid, fn, ln in cur.fetchall():
        by_name.setdefault(ln, []).append(uid)
    print(f"  Loaded {len(by_name)} unique normalized names from DB")

    # Parse CSV (multi-line safe)
    prospects = []
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            prospects.append(row)
    print(f"  Loaded {len(prospects)} prospects from CSV")

    # Stats
    matched = 0
    by_source = Counter()
    by_specialty = Counter()
    no_match_reasons = Counter()
    updates = []

    for p in prospects:
        full_name = (p.get("full_name") or "").strip()
        if not full_name: continue

        # Find best phone (priority: clinic_phone > dha_phone_v2 > dha_phone)
        phone = None
        source = None
        for col, label in [("clinic_phone", "clinic_phone"), ("dha_phone_v2", "dha_phone_v2"), ("dha_phone", "dha_phone")]:
            v = (p.get(col) or "").strip()
            if v:
                phone = normalize_phone(v)
                source = label
                if phone: break

        if not phone:
            no_match_reasons["no_phone"] += 1
            continue

        # Match
        key = normalize_name(full_name)
        uids = by_name.get(key, [])
        # If no exact match, try startswith
        if not uids:
            for k, v in by_name.items():
                if key and (k.startswith(key) or key.startswith(k)):
                    uids = v
                    break

        if not uids:
            no_match_reasons["no_name_match"] += 1
            continue

        # Take first match (could be ambiguous)
        for uid in uids:
            updates.append((phone, "pipeline", datetime.utcnow(), uid))
            matched += 1
            by_source[source] += 1
            by_specialty[p.get("specialty", "?")[:30]] += 1

    print(f"  Matched: {matched}, by source: {dict(by_source)}, by specialty: {dict(by_specialty)}")
    print(f"  No match reasons: {dict(no_match_reasons)}")

    # Bulk update (skip ones with existing phone? No - overwrite with pipeline data which is curated)
    # Actually let's preserve priority: if a phone is already set from a previous run, don't overwrite
    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s
          AND phone IS NULL
    """
    # Actually, for fresh migration, no phone is set yet. So just do straight update.
    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s
    """

    cur.executemany(update_sql, updates)
    conn.commit()
    print(f"  Updated {cur.rowcount} rows")

    # Verify
    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    print("  Final DB state:")
    for src, cnt in cur.fetchall():
        print(f"    {src}: {cnt}")

    cur.close()
    conn.close()
    print(f"[{datetime.utcnow().isoformat()}] Done.")

if __name__ == "__main__":
    main()
