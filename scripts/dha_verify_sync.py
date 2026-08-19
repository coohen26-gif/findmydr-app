#!/usr/bin/env python3
"""
Sync dmd.professional.dha_verified_status / dha_verified_at / dha_expiry_date
from the public DHA Sheryan "Verify professional License/Registration Status"
endpoint (no auth, no CAPTCHA - confirmed via manual pilot on 2026-08-19).

Usage:
  python3 dha_verify_sync.py --limit 1000          # pilot: 1000 random rows
  python3 dha_verify_sync.py                       # full sync: all rows

Resumable: skips rows where dha_verified_at is already set within the last
N days (see FRESH_DAYS), so a re-run after an interruption only processes
what's left. Writes progress + a running status-distribution count to the
log file so it can be checked mid-run without stopping it.
"""
import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from collections import Counter

import psycopg2
import psycopg2.extras
import requests

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")

LOG_FILE = "/opt/dmd/logs/dha_verify_sync_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S") + ".log"

BASE_URL = (
    "https://services.dha.gov.ae/sheryan/wps/portal/home/services-professional/"
    "professional-registrationstatus/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziTfwt3D2MnQ38_d2M"
    "XQ3MAo0cQz1CAowMDEz0w8EKDHAARwP9KEL6o8BKjDw93D2MQErMjBwNAv2dQo2MvB2BRhgSUmAAVYDHDQW5EQaZno6"
    "KACPXQaA!/p0/IZ7_4O8GH3C0OOF3E06Q2AUHTP2007=CZ6_4O8GH3C0OOF3E06Q2AUHTP2004=NJverifyprofessionalstatus=/"
)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

REQUEST_DELAY_SEC = 0.6  # ~1.6 req/s - deliberately conservative, this is a live gov site
TIMEOUT_SEC = 15
MAX_RETRIES = 3
FRESH_DAYS = 30  # skip rows already synced within this window (resumability)


def log(msg):
    line = f"[{datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def parse_dmy(s):
    if not s:
        return None
    try:
        return datetime.strptime(s, "%d/%m/%Y").date()
    except ValueError:
        return None


def fetch_status(dha_unique_id, session):
    url = f"{BASE_URL}?licenseID=&dhaUniqueId={dha_unique_id}"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT_SEC)
            if r.status_code != 200:
                log(f"  {dha_unique_id}: HTTP {r.status_code} (attempt {attempt})")
                time.sleep(2 * attempt)
                continue
            data = r.json()
            license_data = data.get("licenseData")
            if not license_data:
                return "NO_DATA", None
            positions = license_data.get("registeredPositions") or []
            status = positions[0]["status"] if positions else "UNKNOWN"
            expiry = None
            active = license_data.get("activeLicenses") or []
            if active:
                dates = [parse_dmy(a.get("expiryDate")) for a in active]
                dates = [d for d in dates if d]
                if dates:
                    expiry = max(dates)
            return status, expiry
        except (requests.RequestException, ValueError, json.JSONDecodeError) as e:
            log(f"  {dha_unique_id}: error {e} (attempt {attempt})")
            time.sleep(2 * attempt)
    return "FETCH_FAILED", None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="Process only N rows (random sample)")
    args = ap.parse_args()

    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    where = f"WHERE dha_verified_at IS NULL OR dha_verified_at < NOW() - INTERVAL '{FRESH_DAYS} days'"
    order = "ORDER BY random()" if args.limit else "ORDER BY dha_unique_id"
    limit_clause = f"LIMIT {args.limit}" if args.limit else ""
    cur.execute(f"SELECT dha_unique_id FROM dmd.professional {where} {order} {limit_clause}")
    rows = cur.fetchall()
    total = len(rows)
    log(f"=== DHA verify sync starting: {total} rows to process ===")

    session = requests.Session()
    counts = Counter()
    done = 0
    started = time.time()

    for row in rows:
        dha_id = row["dha_unique_id"]
        status, expiry = fetch_status(dha_id, session)
        counts[status] += 1
        cur.execute(
            """UPDATE dmd.professional
                  SET dha_verified_status = %s,
                      dha_verified_at = NOW(),
                      dha_expiry_date = %s
                WHERE dha_unique_id = %s""",
            (status, expiry, dha_id),
        )
        conn.commit()
        done += 1
        if done % 50 == 0 or done == total:
            elapsed = time.time() - started
            rate = done / elapsed if elapsed > 0 else 0
            eta_min = (total - done) / rate / 60 if rate > 0 else 0
            log(f"progress {done}/{total} ({rate:.2f}/s, ETA {eta_min:.1f} min) - counts so far: {dict(counts)}")
        time.sleep(REQUEST_DELAY_SEC)

    log(f"=== DONE: {done} processed ===")
    log(f"Final status distribution: {dict(counts)}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
