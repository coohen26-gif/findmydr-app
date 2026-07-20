#!/usr/bin/env python3
"""V2: Match pipeline by full_name (more aggressive). Also try partial.
"""
import csv
import re
import psycopg2
from collections import Counter
from datetime import datetime

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")

def norm_name(s):
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def norm_phone(p):
    p = (p or "").strip()
    if not p: return None
    digits = re.sub(r"\D", "", p)
    if not digits: return None
    if digits.startswith("971"): return "+" + digits
    if digits.startswith("0") and len(digits) >= 9: return "+971" + digits[1:]
    if len(digits) >= 9: return "+" + digits
    return p

def main():
    print(f"[{datetime.utcnow().isoformat()}] Last-mile direct name match...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT dha_unique_id, full_name, phone FROM dmd.professional")
    by_name = {}
    for uid, fn, ph in cur.fetchall():
        if ph: continue
        n = norm_name(fn)
        by_name.setdefault(n, []).append(uid)
    print(f"  DB names (no phone): {len(by_name)}")

    # Also build a prefix index (last name alone)
    by_last = {}
    for n, uids in by_name.items():
        parts = n.split()
        if parts:
            by_last.setdefault(parts[-1], []).extend(uids)
    print(f"  Last-name index: {len(by_last)} keys")

    matched = 0
    no_match = Counter()
    updates = []
    seen = set()
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            full_name = (row.get("full_name") or "").strip()
            if not full_name: continue

            # Phone
            phone = None
            source = None
            for col, label in [("clinic_phone", "clinic_phone"), ("dha_phone_v2", "dha_phone_v2"), ("dha_phone", "dha_phone")]:
                v = (row.get(col) or "").strip()
                if v:
                    pn = norm_phone(v)
                    if pn:
                        phone = pn; source = label; break
            if not phone:
                no_match["no_phone"] += 1
                continue

            n = norm_name(full_name)
            uids = by_name.get(n, [])

            # Last-name only fallback (risky but try if facility_name is "individual")
            if not uids and " " in n:
                parts = n.split()
                uids = by_last.get(parts[-1], [])

            if not uids:
                no_match["name_not_found"] += 1
                continue

            # Take first unseen uid
            for uid in uids:
                if uid in seen: continue
                seen.add(uid)
                updates.append((phone, "pipeline_last", datetime.utcnow(), uid))
                matched += 1
                break

    print(f"  Matched: {matched}, no_match: {dict(no_match)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    print(f"  Updated {cur.rowcount} rows")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source ORDER BY 2 DESC")
    print("  Final:")
    total = 0
    for s, c in cur.fetchall():
        print(f"    {s}: {c}")
        total += c
    print(f"  TOTAL: {total}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
