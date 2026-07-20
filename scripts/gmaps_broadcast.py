#!/usr/bin/env python3
"""Extract phones from gmaps_undetected_v3_cache.json and broadcast to DB.
This cache has ~200+ dental/medical facilities with phones from Abu Dhabi.
We match by name and broadcast to all DB pros at that facility.
"""
import json
import re
import psycopg2
from collections import Counter, defaultdict
from datetime import datetime

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")
CACHE_FILE = "/opt/dmd/sales/gmaps_undetected_v3_cache.json"
LOG_FILE = "/opt/dmd/logs/gmaps_broadcast_" + datetime.utcnow().strftime("%Y%m%d") + ".log"

def log(msg):
    line = f"[{datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def norm(s):
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def extract_phone(s):
    """Extract the first phone from GMaps phone string. Strips emoji prefix."""
    if not s: return None
    s = re.sub(r"^[^\d\+]+", "", s).strip()
    digits = re.sub(r"\D", "", s)
    if not digits: return None
    if digits.startswith("971"):
        return "+" + digits
    if digits.startswith("0") and len(digits) >= 9:
        return "+971" + digits[1:]
    if len(digits) >= 9:
        return "+" + digits
    return s

def main():
    log("=== GMaps cache broadcast ===")
    cache = json.load(open(CACHE_FILE))
    log(f"  Cache keys: {len(cache)}")
    # cache is {city::query: [places...]}
    # Collect all (place_name, phone) pairs
    name_to_phone = {}
    for key, places in cache.items():
        if not isinstance(places, list): continue
        for p in places:
            name = p.get("name", "")
            ph_raw = p.get("phone", "")
            ph = extract_phone(ph_raw)
            if name and ph:
                # Use first phone we see for a name
                nn = norm(name)
                if nn and nn not in name_to_phone:
                    name_to_phone[nn] = ph
    log(f"  Unique places with phones: {len(name_to_phone)}")

    # Build matching against DB facilities
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT facility_name FROM dmd.professional WHERE facility_name IS NOT NULL AND phone IS NULL")
    db_facs = [(r[0], norm(r[0])) for r in cur.fetchall()]
    log(f"  DB facilities without phone: {len(db_facs)}")

    # Match strategy: 
    # 1) exact normalized
    # 2) substring in both directions (>= 6 char shared token)
    db_by_norm = {n: o for o, n in db_facs}
    matched = []  # (phone, db_fac_name, matched_name)
    for nn, ph in name_to_phone.items():
        # 1) exact
        if nn in db_by_norm:
            matched.append((ph, db_by_norm[nn], nn))
            continue
        # 2) token overlap
        nn_tokens = set(t for t in nn.split() if len(t) >= 4)
        if not nn_tokens: continue
        best = None
        best_score = 0
        for o, n in db_facs:
            o_tokens = set(t for t in n.split() if len(t) >= 4)
            if not o_tokens: continue
            inter = nn_tokens & o_tokens
            if not inter: continue
            # Score: chars overlap / max length
            score = sum(len(t) for t in inter) / max(len(nn_tokens)+len(o_tokens), 1)
            if score > best_score and score >= 0.4:
                best = o
                best_score = score
        if best:
            matched.append((ph, best, nn))

    log(f"  Matched: {len(matched)}")
    # Apply: for each (phone, facility), set phone on all pros at that facility without phone
    updates = []
    fac_counts = Counter()
    for ph, fac, src_name in matched:
        cur.execute("SELECT dha_unique_id FROM dmd.professional WHERE facility_name = %s AND phone IS NULL", (fac,))
        uids = [r[0] for r in cur.fetchall()]
        for uid in uids:
            updates.append((ph, "gmaps_cache", datetime.utcnow(), uid))
            fac_counts[fac] += 1

    log(f"  Total updates: {len(updates)}, facilities: {len(fac_counts)}")

    # Dedupe uids (in case a pro at facility A matched twice)
    seen = set()
    uniq_updates = []
    for u in updates:
        if u[3] in seen: continue
        seen.add(u[3])
        uniq_updates.append(u)
    log(f"  Unique updates: {len(uniq_updates)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, uniq_updates)
    conn.commit()
    log(f"  Updated {cur.rowcount} rows")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    log("  Final state:")
    for s, c in cur.fetchall():
        log(f"    {s}: {c}")
    cur.execute("SELECT COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL")
    total = cur.fetchone()[0]
    log(f"  Total: {total} / 65589 = {100*total/65589:.2f}%")

    # Top facilities
    log("  Top 10 facilities covered:")
    for f, c in fac_counts.most_common(10):
        log(f"    {f[:50]:50s} {c:4d} pros")

    cur.close()
    conn.close()
    log("=== Done ===")

if __name__ == "__main__":
    main()
