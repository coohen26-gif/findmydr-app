#!/usr/bin/env python3
"""Find facilities in dmd.professional that also have a website in the pipeline.
Then: cross-assign phone from pipeline to all pros at that facility.
"""
import csv
import re
import psycopg2
from collections import defaultdict
from datetime import datetime

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")

def norm_fac(s):
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
    print(f"[{datetime.utcnow().isoformat()}] Facility matching start...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Load facilities from DB
    cur.execute("SELECT DISTINCT facility_name FROM dmd.professional WHERE facility_name IS NOT NULL")
    db_facs = set(r[0] for r in cur.fetchall())
    db_fac_norm = {norm_fac(f): f for f in db_facs}
    print(f"  DB has {len(db_facs)} unique facility_name")

    # Load pipeline
    site_per_fac = {}  # norm_fac -> best website
    phone_per_fac = {}  # norm_fac -> best phone
    name_per_fac = {}   # norm_fac -> original name
    prospects = []
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            prospects.append(row)

    matched_fac = 0
    for p in prospects:
        clinic = (p.get("clinic_name_matched") or p.get("facility_name") or "").strip()
        if not clinic: continue
        n = norm_fac(clinic)
        if n in db_fac_norm:
            matched_fac += 1
            name_per_fac[n] = clinic
            # Prefer clinic_website_v2 > others
            for col in ["clinic_website_v2"]:
                v = (p.get(col) or "").strip()
                if v and "?" not in v and v != "https://bizonline.ae":
                    if n not in site_per_fac:
                        site_per_fac[n] = v
            # Phone priority
            for col in ["clinic_phone", "dha_phone_v2", "dha_phone"]:
                v = (p.get(col) or "").strip()
                if v:
                    pn = norm_phone(v)
                    if pn and n not in phone_per_fac:
                        phone_per_fac[n] = pn

    print(f"  Matched {matched_fac} pipeline facilities with DB")

    # Now for each matched facility, find all pros in DB at that facility without phone
    updates = []
    fac_stats = []
    for n, fac in db_fac_norm.items():
        if n in phone_per_fac:
            phone = phone_per_fac[n]
            cur.execute("SELECT dha_unique_id FROM dmd.professional WHERE facility_name = %s AND phone IS NULL", (fac,))
            uids = [r[0] for r in cur.fetchall()]
            for uid in uids:
                updates.append((phone, "pipeline_facility", datetime.utcnow(), uid))
            if uids:
                fac_stats.append((fac, len(uids), phone))

    print(f"  Facilities with phone in pipeline: {len(phone_per_fac)}")
    print(f"  Total pros to update (without phone, at matched facility): {len(updates)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    print(f"  Updated {cur.rowcount} rows")

    # Top facilities
    fac_stats.sort(key=lambda x: -x[1])
    print("\n  Top 10 facilities covered:")
    for f, c, p in fac_stats[:10]:
        print(f"    {f[:50]:50s} {c:4d} pros -> {p}")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    print("\n  Final:")
    for s, c in cur.fetchall():
        print(f"    {s}: {c}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
