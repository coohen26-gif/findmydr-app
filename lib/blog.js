// lib/blog.js
// Server-side helpers for blog articles
const fs = require('fs');
const path = require('path');

const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];
// Slugs come straight from the [slug] route param with zero sanitization
// downstream, so they must be whitelisted before ever touching the
// filesystem — otherwise "../" (or its percent-encoded form) lets an
// attacker escape the articles/ directory and read arbitrary .json files.
const SAFE_SLUG_RE = /^[a-z0-9-]+$/;

function readArticle(locale, slug) {
  try {
    if (typeof locale !== 'string' || !SUPPORTED_LOCALES.includes(locale)) return null;
    if (typeof slug !== 'string' || !SAFE_SLUG_RE.test(slug)) return null;
    const fp = path.join(process.cwd(), 'public', 'locales', locale, 'articles', `${slug}.json`);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (_) {
    return null;
  }
}

function listArticles(locale) {
  try {
    const dir = path.join(process.cwd(), 'public', 'locales', locale, 'articles');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch (_) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  } catch (_) {
    return [];
  }
}

function listAllSlugs() {
  try {
    const dir = path.join(process.cwd(), 'public', 'locales', 'fr', 'articles');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
  } catch (_) {
    return [];
  }
}

module.exports = { readArticle, listArticles, listAllSlugs };
