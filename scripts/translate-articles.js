#!/usr/bin/env node
/**
 * WS4 - Translate FR SEO articles to 5 other locales using Groq.
 * Falls back to copying FR content if GROQ_API_KEY is missing.
 *
 * Output: public/locales/{en,ar,zh,ru,fa}/articles/{slug}.json
 * Each JSON has: { slug, title, description, body, locale, updated_at }
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SRC_DIR = '/opt/dmd/dubai-medical-directory/content/seo-articles';
const OUT_DIR = '/opt/findmydr-app/public/locales';
const LOCALES = ['en', 'ar', 'zh', 'ru', 'fa'];
const SOURCE_LOCALE = 'fr';
const GLOSSARY_PATH = '/opt/dmd/translations/glossary.md';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  m[1].split('\n').forEach(line => {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) {
      let v = kv[2].replace(/^["']|["']$/g, '').trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        try { v = JSON.parse(v.replace(/'/g, '"')); } catch (_) { v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')); }
      }
      meta[kv[1]] = v;
    }
  });
  return { meta, body: m[2].trim() };
}

function loadGlossary() {
  try {
    return fs.readFileSync(GLOSSARY_PATH, 'utf8').slice(0, 4000);
  } catch (_) {
    return '';
  }
}

function callGroq(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are a medical SEO translator. Output ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.3,
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
        if (res.statusCode !== 200) return reject(new Error(`Groq ${res.statusCode}: ${body.slice(0, 200)}`));
        try {
          const j = JSON.parse(body);
          resolve(j.choices?.[0]?.message?.content || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function translateArticle(meta, body, targetLocale) {
  if (!GROQ_API_KEY) {
    return { slug: meta.slug, title: meta.title, description: meta.description || meta.meta_description || '', body, locale: targetLocale, source_locale: SOURCE_LOCALE, updated_at: new Date().toISOString(), translation_pending: true, reason: 'GROQ_API_KEY not set' };
  }
  const prompt = `Translate this medical SEO article from French to ${targetLocale}.
Preserve markdown structure. Keep medical terms accurate. Output JSON with keys:
{ "title": string, "description": string, "body": string }

META:
${JSON.stringify(meta, null, 2)}

GLOSSARY (medical terms reference):
${loadGlossary()}

BODY:
${body.slice(0, 6000)}`;
  try {
    const out = await callGroq(prompt);
    const json = out.match(/\{[\s\S]*\}/);
    if (!json) throw new Error('No JSON in response');
    const parsed = JSON.parse(json[0]);
    return { slug: meta.slug, title: parsed.title || meta.title, description: parsed.description || meta.description || '', body: parsed.body || body, locale: targetLocale, source_locale: SOURCE_LOCALE, updated_at: new Date().toISOString() };
  } catch (e) {
    console.error(`[translate] ${targetLocale} ${meta.slug}: ${e.message} (using FR fallback)`);
    return { slug: meta.slug, title: meta.title, description: meta.description || meta.meta_description || '', body, locale: targetLocale, source_locale: SOURCE_LOCALE, updated_at: new Date().toISOString(), translation_pending: true };
  }
}

async function main() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.md'));
  console.log(`[translate-articles] Found ${files.length} source articles`);

  for (const f of files) {
    const md = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
    const { meta, body } = parseFrontmatter(md);
    const slug = meta.slug || f.replace(/\.md$/, '');

    // Always write FR version (canonical)
    const frOut = { slug, title: meta.title, description: meta.description || meta.meta_description || '', body, locale: 'fr', source_locale: 'fr', updated_at: new Date().toISOString() };
    const frDir = path.join(OUT_DIR, 'fr', 'articles');
    fs.mkdirSync(frDir, { recursive: true });
    fs.writeFileSync(path.join(frDir, `${slug}.json`), JSON.stringify(frOut, null, 2));
    console.log(`[fr] wrote ${slug}.json`);

    for (const loc of LOCALES) {
      const out = await translateArticle(meta, body, loc);
      const dir = path.join(OUT_DIR, loc, 'articles');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(out, null, 2));
      console.log(`[${loc}] wrote ${slug}.json (${out.translation_pending ? 'fallback' : 'groq'})`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
