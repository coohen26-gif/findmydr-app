#!/usr/bin/env node
/**
 * WS16 - Re-generate FR SEO articles in 5 other locales using Groq (llama-3.3-70b-versatile).
 *
 * Goals:
 * - Force a higher quality than WS4 manual translations by:
 *   1) clearer prompt with role + glossary + audience
 *   2) JSON-only output with strict schema
 *   3) per-locale instructions (e.g. RTL for AR/FA, Cyrillic for RU, simplified CN for ZH)
 *   4) preserve markdown formatting + medical accuracy
 *
 * Usage:
 *   GROQ_API_KEY=gsk_xxx node scripts/translate-articles-groq.js            (full)
 *   node scripts/translate-articles-groq.js --dry-run                       (no calls, just verify)
 *   node scripts/translate-articles-groq.js --locale=en --slug=dentiste...   (one)
 *   node scripts/translate-articles-groq.js --force                         (overwrite existing)
 *
 * Output: public/locales/{en,ar,zh,ru,fa}/articles/{slug}.json
 * Log:    /tmp/translate-groq.log
 *
 * Without GROQ_API_KEY -> dry-run mode, only logs what would happen.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SRC_DIR = '/opt/dmd/dubai-medical-directory/content/seo-articles';
const OUT_DIR = '/opt/findmydr-app/public/locales';
const GLOSSARY_PATH = '/opt/dmd/translations/glossary.md';
const LOG_PATH = '/tmp/translate-groq.log';

const LOCALES = ['en', 'ar', 'zh', 'ru', 'fa'];
const SOURCE_LOCALE = 'fr';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const argv = process.argv.slice(2);
const DRY_RUN = !GROQ_API_KEY || argv.includes('--dry-run');
const FORCE = argv.includes('--force');
const ONLY_LOCALE = (argv.find(a => a.startsWith('--locale=')) || '').replace('--locale=', '');
const ONLY_SLUG = (argv.find(a => a.startsWith('--slug=')) || '').replace('--slug=', '');

function log(line) {
  const stamp = new Date().toISOString();
  const out = `[${stamp}] ${line}`;
  console.log(out);
  try { fs.appendFileSync(LOG_PATH, out + '\n'); } catch (_) {}
}

function readArticle(slug) {
  const fp = path.join(SRC_DIR, `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const md = fs.readFileSync(fp, 'utf8');
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { title: slug, body: md };
  const meta = {};
  m[1].split('\n').forEach(line => {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  });
  return { title: meta.title || slug, description: meta.description || '', body: m[2].trim() };
}

function loadGlossary() {
  try { return fs.readFileSync(GLOSSARY_PATH, 'utf8').slice(0, 4000); } catch (_) { return ''; }
}

const LOCALE_INSTRUCTIONS = {
  en: 'Translate to professional English (US). Keep medical terms accurate. Audience: English-speaking expats in Dubai.',
  ar: 'Translate to formal Modern Standard Arabic (فصحى). Keep medical terms accurate; Latin medical names may stay. Use right-to-left headings. Audience: Arabic-speaking patients in UAE.',
  zh: '翻译为简体中文 (Simplified Chinese)。保留医学术语准确性（拉丁名可保留）。目标读者:在迪拜讲中文的华人患者。',
  ru: 'Переведите на профессиональный русский язык. Сохраняйте медицинскую точность. Аудитория: русскоязычные экспаты в Дубае.',
  fa: 'ترجم به فارسی رسمی. اصطلاحات پزشکی را دقیق نگه دار. مخاطب: بیماران فارسی‌زبان در دبی.',
};

function buildPrompt(locale, title, body, glossary) {
  return [
    `You are a senior medical SEO translator for FindMyDoctor.ae (Dubai healthcare directory).`,
    `Translate the following French medical article into ${locale.toUpperCase()}.`,
    LOCALE_INSTRUCTIONS[locale] || '',
    '',
    'Constraints:',
    '- Preserve all markdown formatting (#, ##, **bold**, tables, lists, links, --- separators).',
    '- Keep placeholders like {count}, AED, DHA, JBR, etc. as-is.',
    '- Keep proper nouns (Dubai Marina, JBR, DHA, Allianz, etc.) unchanged.',
    '- Keep prices (AED 250-450) unchanged.',
    '- Keep URLs (/fr/dentiste/...) unchanged.',
    '- Do NOT add commentary. Output JSON only.',
    '',
    'Output format (strict JSON, no markdown fences):',
    '{"title": "...", "description": "...", "body": "..."}',
    '',
    'Glossary (medical + DXB-specific terms, first 4000 chars):',
    glossary || '(no glossary available)',
    '',
    '=== ARTICLE START ===',
    `Title: ${title}`,
    '',
    body,
    '=== ARTICLE END ===',
  ].join('\n');
}

function callGroq(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You translate medical articles. Output ONLY valid JSON matching the requested schema. No fences, no commentary.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`Groq ${res.statusCode}: ${body.slice(0, 300)}`));
        try {
          const j = JSON.parse(body);
          const content = j.choices?.[0]?.message?.content || '';
          // Strip any stray markdown fences defensively
          const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          resolve(parsed);
        } catch (e) { reject(new Error(`parse error: ${e.message}; raw=${body.slice(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(new Error('Groq timeout 60s')); });
    req.write(data);
    req.end();
  });
}

function writeArticle(locale, slug, payload, srcMeta) {
  const dir = path.join(OUT_DIR, locale, 'articles');
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, `${slug}.json`);
  const out = {
    slug,
    title: payload.title || srcMeta.title,
    description: payload.description || srcMeta.description || '',
    body: payload.body || srcMeta.body,
    locale,
    source_locale: SOURCE_LOCALE,
    updated_at: new Date().toISOString(),
    translated_by: 'groq-llama-3.3-70b-versatile',
  };
  fs.writeFileSync(fp, JSON.stringify(out, null, 2));
  return fp;
}

async function main() {
  log('=== translate-articles-groq.js START ===');
  log(`DRY_RUN=${DRY_RUN} GROQ_KEY=${GROQ_API_KEY ? '***' + GROQ_API_KEY.slice(-4) : 'MISSING'} MODEL=${GROQ_MODEL}`);
  log(`FORCE=${FORCE} ONLY_LOCALE=${ONLY_LOCALE || '-'} ONLY_SLUG=${ONLY_SLUG || '-'}`);

  // List source articles (exclude keywords-research-*)
  const articles = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.md'))
    .filter(f => !f.startsWith('keywords-research-'))
    .map(f => f.replace(/\.md$/, ''))
    .filter(s => !ONLY_SLUG || s === ONLY_SLUG);
  log(`Found ${articles.length} source articles: ${articles.join(', ')}`);

  const glossary = loadGlossary();
  log(`Glossary loaded: ${glossary.length} chars`);

  const locales = ONLY_LOCALE ? [ONLY_LOCALE] : LOCALES;
  let okCount = 0, skipCount = 0, errCount = 0;

  for (const slug of articles) {
    const src = readArticle(slug);
    if (!src) { log(`SKIP ${slug}: cannot read source`); continue; }
    for (const loc of locales) {
      const outPath = path.join(OUT_DIR, loc, 'articles', `${slug}.json`);
      if (fs.existsSync(outPath) && !FORCE) {
        log(`SKIP ${loc}/${slug}: exists (use --force to overwrite)`);
        skipCount++;
        continue;
      }
      if (DRY_RUN) {
        log(`DRY-RUN ${loc}/${slug}: would call Groq`);
        okCount++;
        continue;
      }
      try {
        const prompt = buildPrompt(loc, src.title, src.body, glossary);
        log(`CALL ${loc}/${slug}: ${prompt.length} chars prompt`);
        const t0 = Date.now();
        const result = await callGroq(prompt);
        const ms = Date.now() - t0;
        if (!result.body || result.body.length < 100) throw new Error('empty/short body');
        writeArticle(loc, slug, result, src);
        log(`OK ${loc}/${slug} in ${ms}ms (${result.body.length} bytes body)`);
        okCount++;
        // rate limit politeness
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        log(`ERR ${loc}/${slug}: ${e.message}`);
        errCount++;
      }
    }
  }

  log(`=== DONE ok=${okCount} skip=${skipCount} err=${errCount} ===`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });