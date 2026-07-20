#!/usr/bin/env python3
"""V2: Match by (specialty, name token overlap) + facility_name.
Re-imports with broader matching, keeps existing pipeline source if better matched.
"""
import csv
import sys
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
    return p  # keep as-is

def tokens(s):
    return set(norm_name(s).split())

def main():
    print(f"[{datetime.utcnow().isoformat()}] V2 import starting...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Load DB pros
    cur.execute("SELECT dha_unique_id, full_name, specialty, facility_name, phone FROM dmd.professional")
    pros = cur.fetchall()
    print(f"  Loaded {len(pros)} pros from DB")

    # Build indexes
    by_norm_name = {}
    for uid, fn, sp, fac, ph in pros:
        if ph: continue  # already has phone
        n = norm_name(fn)
        by_norm_name.setdefault(n, []).append((uid, sp, fac))

    # Specialty -> list of (uid, name_tokens, facility)
    by_spec = {}
    for uid, fn, sp, fac, ph in pros:
        if ph: continue
        by_spec.setdefault(sp, []).append((uid, tokens(fn), fac))

    # Load CSV
    prospects = []
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            prospects.append(row)
    print(f"  Loaded {len(prospects)} prospects from CSV")

    matched = 0
    by_source = Counter()
    by_match_type = Counter()
    no_match = Counter()
    updates = []
    seen_uids = set()  # avoid double-updating same uid (one-to-one by uid)

    for p in prospects:
        full_name = (p.get("full_name") or "").strip()
        if not full_name: continue

        # Find best phone
        phone = None
        source = None
        for col, label in [("clinic_phone", "clinic_phone"), ("dha_phone_v2", "dha_phone_v2"), ("dha_phone", "dha_phone")]:
            v = (p.get(col) or "").strip()
            if v:
                pn = norm_phone(v)
                if pn:
                    phone = pn
                    source = label
                    break
        if not phone:
            no_match["no_phone"] += 1
            continue

        # Try matching strategies in order
        uids = []
        match_type = None

        # 1) Exact normalized name
        n = norm_name(full_name)
        if n in by_norm_name:
            uids = [t[0] for t in by_norm_name[n]]
            match_type = "exact_name"
        else:
            # 2) Substring match on specialty + token overlap >= 60%
            spec = (p.get("specialty") or "").strip()
            t_pro = tokens(full_name)
            if spec in by_spec and t_pro:
                candidates = by_spec[spec]
                best = []
                for uid, t_name, fac in candidates:
                    inter = t_pro & t_name
                    if not inter: continue
                    overlap = len(inter) / max(len(t_pro), len(t_name), 1)
                    if overlap >= 0.6 and len(t_pro) >= 2:
                        best.append((overlap, uid))
                if best:
                    best.sort(reverse=True)
                    uids = [b[1] for b in best[:3]]  # top 3
                    match_type = f"token_overlap"

        if not uids:
            no_match["name_not_found"] += 1
            continue

        # Take the first unseen
        for uid in uids:
            if uid in seen_uids: continue
            seen_uids.add(uid)
            updates.append((phone, "pipeline_v2", datetime.utcnow(), uid))
            matched += 1
            by_source[source] += 1
            by_match_type[match_type] += 1
            break

    print(f"  Matched: {matched}")
    print(f"  By source: {dict(by_source)}")
    print(f"  By match type: {dict(by_match_type)}")
    print(f"  No match: {dict(no_match)}")

    # Only update if phone is still NULL (don't overwrite existing from V1)
    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    print(f"  V2 updated {cur.rowcount} new rows (NULL before)")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    print("  Final DB state:")
    for src, cnt in cur.fetchall():
        print(f"    {src}: {cnt}")

    cur.close()
    conn.close()
    print(f"[{datetime.utcnow().isoformat()}] Done.")

if __name__ == "__main__":
    main()
