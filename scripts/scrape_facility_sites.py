#!/usr/bin/env python3
"""Scrape phones from facility websites (pipeline_enriched_v7.csv clinic_website_v2).
Async with rate limit, regex UAE phone, save cache, then inject.
"""
import csv
import re
import json
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from collections import defaultdict, Counter
from datetime import datetime
import psycopg2
import sys
import os

DB = dict(host="127.0.0.1", port=55432, dbname="findmydr", user="findmydr",
          password="d63468cdc231bf71897c375eba435f501f7685f6bbe6b60ee1b19346e2d9959a")

CACHE_FILE = "/opt/dmd/scripts/phones/sites_cache.json"
LOG_FILE = "/opt/dmd/logs/scrape_sites_" + datetime.utcnow().strftime("%Y%m%d") + ".log"

PHONE_PATTERNS = [
    re.compile(r"\+971[\s\-\.]?\d{1,2}[\s\-\.]?\d{3}[\s\-\.]?\d{4}"),
    re.compile(r"\b0\d{1,2}[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b"),
    re.compile(r"\b9\d{1}[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b"),  # mobile local
    re.compile(r"971[\s\-\.]?\d{1,2}[\s\-\.]?\d{3}[\s\-\.]?\d{4}"),
]

def extract_phones(html):
    """Extract UAE phone numbers from HTML, prioritize contact/about/footer pages."""
    soup = BeautifulSoup(html, "html.parser")
    # Strip scripts/styles
    for s in soup(["script", "style", "noscript"]):
        s.decompose()
    text = soup.get_text(separator=" ", strip=True)
    phones = set()
    for pat in PHONE_PATTERNS:
        for m in pat.findall(text):
            phones.add(m.strip())
    # Also look in href="tel:" and meta
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("tel:"):
            ph = href[4:].strip()
            ph = re.sub(r"[^\d\+]", "", ph)
            if ph:
                phones.add(ph)
    return phones

def normalize_phone(p):
    p = (p or "").strip()
    if not p: return None
    digits = re.sub(r"\D", "", p)
    if not digits: return None
    if digits.startswith("971"):
        return "+" + digits
    if digits.startswith("0") and len(digits) >= 9:
        return "+971" + digits[1:]
    if len(digits) >= 9 and digits.startswith("9"):
        return "+971" + digits
    if len(digits) >= 9:
        return "+" + digits
    return p

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2, default=str)

def log(msg):
    line = f"[{datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

async def fetch_one(session, url, semaphore):
    """Fetch a URL, return (url, status, html) or (url, error_msg, None)."""
    async with semaphore:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (DMD-Scraper/1.0; +https://findmydr.ae)"}
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15), ssl=False, allow_redirects=True) as resp:
                if resp.status == 200:
                    html = await resp.text(errors="ignore")
                    return (url, resp.status, html)
                return (url, resp.status, None)
        except Exception as e:
            return (url, str(e)[:200], None)

async def main():
    log("=== Starting facility sites scrape ===")
    cache = load_cache()
    log(f"  Cache loaded: {len(cache)} entries")

    # Load sites from pipeline
    sites = set()
    site_to_facility = {}  # url -> list of facility_name matched in pipeline
    with open("/opt/dmd/sales/pipeline_enriched_v7.csv", "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            url = (row.get("clinic_website_v2") or "").strip()
            if not url or "?sandbox" in url or url == "https://bizonline.ae":
                continue
            if any(x in url for x in ["facebook.com", "instagram.com", "twitter.com", "linkedin.com"]):
                continue
            sites.add(url)
            fac = (row.get("clinic_name_matched") or row.get("facility_name") or "").strip()
            if fac:
                site_to_facility.setdefault(url, []).append(fac)

    sites = sorted(sites)
    log(f"  Sites to scrape: {len(sites)}")

    # Skip already cached
    to_fetch = [s for s in sites if s not in cache]
    log(f"  Already cached: {len(sites) - len(to_fetch)}, to fetch: {len(to_fetch)}")

    # Rate limit: 3 concurrent, 0.5s between
    semaphore = asyncio.Semaphore(3)
    connector = aiohttp.TCPConnector(limit=5, limit_per_host=2, ttl_dns_cache=300)
    timeout = aiohttp.ClientTimeout(total=15)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        results = []
        for i in range(0, len(to_fetch), 5):
            batch = to_fetch[i:i+5]
            tasks = [fetch_one(session, url, semaphore) for url in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in batch_results:
                if isinstance(r, Exception):
                    continue
                url, status, html = r
                cache[url] = {"status": status, "html_len": len(html) if html else 0, "fetched_at": datetime.utcnow().isoformat()}
                if html:
                    phones = extract_phones(html)
                    normed = set()
                    for p in phones:
                        np = normalize_phone(p)
                        if np: normed.add(np)
                    cache[url]["phones_raw"] = list(phones)
                    cache[url]["phones"] = list(normed)
            # Save cache every batch
            save_cache(cache)
            log(f"  Progress: {i+len(batch)}/{len(to_fetch)} fetched")
            await asyncio.sleep(0.3)

    log("  === Scrape done, analyzing phones ===")
    url_to_phones = {}
    for url, info in cache.items():
        if info.get("status") == 200 and info.get("phones"):
            url_to_phones[url] = info["phones"]

    log(f"  URLs with phones extracted: {len(url_to_phones)}")

    # Match URL to facility
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Load facility normalization
    cur.execute("SELECT DISTINCT facility_name FROM dmd.professional WHERE facility_name IS NOT NULL")
    db_fac_norm = {}
    for (fn,) in cur.fetchall():
        n = re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", fn.lower())).strip()
        db_fac_norm[n] = fn

    # For each URL with phones, find all DB facilities that match the pipeline's clinic_name_matched
    updates = []
    fac_phone_stats = Counter()
    for url, phones in url_to_phones.items():
        # Take the "best" phone (shortest = main switchboard)
        phones_sorted = sorted(phones, key=lambda p: (len(re.sub(r"\D","",p)), p))
        best_phone = phones_sorted[0]
        # Get facility name from pipeline
        facs = site_to_facility.get(url, [])
        for fac in facs:
            n = re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", fac.lower())).strip()
            db_fac = db_fac_norm.get(n)
            if not db_fac: continue
            cur.execute("SELECT dha_unique_id FROM dmd.professional WHERE facility_name = %s AND phone IS NULL", (db_fac,))
            uids = [r[0] for r in cur.fetchall()]
            for uid in uids:
                updates.append((best_phone, "facility_site", datetime.utcnow(), uid))
                fac_phone_stats[db_fac] += 1

    log(f"  Total updates to apply: {len(updates)}")
    log(f"  Facilities covered: {len(fac_phone_stats)}")

    update_sql = """
        UPDATE dmd.professional
        SET phone = %s, phone_source = %s, phone_verified_at = %s
        WHERE dha_unique_id = %s AND phone IS NULL
    """
    cur.executemany(update_sql, updates)
    conn.commit()
    log(f"  Updated {cur.rowcount} rows in DB")

    cur.execute("SELECT phone_source, COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL GROUP BY phone_source")
    log("  === Final state ===")
    for s, c in cur.fetchall():
        log(f"    {s}: {c}")

    cur.execute("SELECT COUNT(*) FROM dmd.professional WHERE phone IS NOT NULL")
    total = cur.fetchone()[0]
    log(f"  Total with phone: {total} / 65589 = {100*total/65589:.2f}%")

    cur.close()
    conn.close()
    log("=== Done ===")

if __name__ == "__main__":
    asyncio.run(main())
