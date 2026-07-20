#!/usr/bin/env python3
"""V3: Match by normalized full_name only (no specialty filter).
This catches the 19 specs that don't match exactly. Strategy:
- norm_name(pipeline.full_name) == norm_name(db.full_name) → match
- OR: norm_name matches a known alias (we add common short forms)
- Bulk import — 312 prospects have phones, 77 already imported, expect ~150-200 more.
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
    if digits.startswith("971"):
        return "+" + digits
    if digits.startswith("0") and len(digits) >= 9:
        return "+971" + digits[1:]
    if len(digits) >= 9:
        return "+" + digits
    return p

def main():
    print(f"[{datetime.utcnow().isoformat()}] V3 import starting...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    cur.execute("SELECT dha_unique_id, full_name, phone FROM dmd.professional")
    by_name = {}
    for uid, fn, ph in cur.fetchall():
        if ph: continue
        n = norm_name(fn)
        by_name.setdefault(n, []).append(uid)
    print(f"  Loaded {len(by_name)} unique names (excluding those with phone)")

    # Also a fuzzy index: first 2 tokens + last token
    fuzzy = {}
    for n in by_name:
        parts = n.split()
        if len(parts) >= 2:
            key = (parts[0], parts[-1])  # first + last
            fuzzy.setdefault(key, []).extend(by_name[n])
    print(f"  Fuzzy index: {len(fuzzy)} keys (first+last)")

    prospects = []
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            prospects.append(row)

    matched = 0
    by_source = Counter()
    by_match_type = Counter()
    no_match = Counter()
    updates = []
    seen = set()

    for p in prospects:
        full_name = (p.get("full_name") or "").strip()
        if not full_name: continue

        # Best phone
        phone = None
        source = None
        for col, label in [("clinic_phone", "clinic_phone"), ("dha_phone_v2", "dha_phone_v2"), ("dha_phone", "dha_phone")]:
            v = (p.get(col) or "").strip()
            if v:
                pn = norm_phone(v)
                if pn:
                    phone = pn; source = label; break
        if not phone:
            no_match["no_phone"] += 1
            continue

        n = norm_name(full_name)
        uids = []
        mt = None

        if n in by_name:
            uids = by_name[n]
            mt = "exact_norm"
        else:
            # Fuzzy: first + last token
            parts = n.split()
            if len(parts) >= 2:
                key = (parts[0], parts[-1])
                if key in fuzzy:
                    uids = fuzzy[key]
                    mt = "fuzzy_first_last"

        if not uids:
            no_match["name_not_found"] += 1
            continue

        for uid in uids:
            if uid in seen: continue
            seen.add(uid)
            updates.append((phone, "pipeline_v3", datetime.utcnow(), uid))
            matched += 1
            by_source[source] += 1
            by_match_type[mt] += 1
            break

    print(f"  Matched: {matched}")
    print(f"  By source: {dict(by_source)}")
    print(f"  By match type: {dict(by_match_type)}")
    print(f"  No match: {dict(no_match)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    print(f"  Updated {cur.rowcount} new rows")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    print("  Final:")
    for s, c in cur.fetchall():
        print(f"    {s}: {c}")

    cur.close()
    conn.close()
    print(f"[{datetime.utcnow().isoformat()}] Done.")

if __name__ == "__main__":
    main()
