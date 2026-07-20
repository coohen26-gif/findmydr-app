import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { readArticle } from '../../lib/blog';

const SITE_LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];

function inlineMd(s) {
  if (!s) return s;
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={parts.length}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('*')) parts.push(<em key={parts.length}>{tok.slice(1, -1)}</em>);
    else if (tok.startsWith('`')) parts.push(<code key={parts.length} className="px-1 py-0.5 rounded bg-muted text-sm">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) parts.push(<a key={parts.length} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">{lm[1]}</a>);
      else parts.push(tok);
    }
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split('\n');
  const blocks = [];
  let list = null;
  let inCode = false;
  let codeBuf = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push(<pre key={`c-${i}`} className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>{codeBuf.join('\n')}</code></pre>);
        codeBuf = [];
        inCode = false;
      } else { inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (/^#\s/.test(line)) blocks.push(<h1 key={i} className="text-3xl md:text-4xl font-extrabold mt-8 mb-4">{inlineMd(line.slice(2))}</h1>);
    else if (/^##\s/.test(line)) blocks.push(<h2 key={i} className="text-2xl md:text-3xl font-extrabold mt-8 mb-3">{inlineMd(line.slice(3))}</h2>);
    else if (/^###\s/.test(line)) blocks.push(<h3 key={i} className="text-xl font-bold mt-6 mb-2">{inlineMd(line.slice(4))}</h3>);
    else if (/^[-*]\s/.test(line)) {
      if (!list) list = [];
      list.push(line.slice(2));
    } else if (line.trim() === '' && list) {
      blocks.push(<ul key={`ul-${i}`} className="list-disc pl-6 my-3 space-y-1">{list.map((it, j) => <li key={j}>{inlineMd(it)}</li>)}</ul>);
      list = null;
    } else if (line.trim() !== '') {
      if (list) {
        blocks.push(<ul key={`ul-${i}`} className="list-disc pl-6 my-3 space-y-1">{list.map((it, j) => <li key={j}>{inlineMd(it)}</li>)}</ul>);
        list = null;
      }
      blocks.push(<p key={i} className="my-3 text-pretty leading-relaxed">{inlineMd(line)}</p>);
    }
  }
  if (list) {
    blocks.push(<ul key={`ul-end`} className="list-disc pl-6 my-3 space-y-1">{list.map((it, j) => <li key={j}>{inlineMd(it)}</li>)}</ul>);
  }
  return blocks;
}

export async function getServerSideProps({ params, query, req, locale }) {
  const slug = params?.slug || query?.slug;
  if (!slug) return { notFound: true };

  let article = readArticle(locale || 'fr', slug);
  if (!article) article = readArticle('fr', slug);
  if (!article) return { notFound: true };

  const baseUrl = `https://${req.headers.host}`;
  return {
    props: {
      article,
      slug,
      baseUrl,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default function BlogArticle({ article, baseUrl }) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const currentLocale = i18n.language || 'fr';
  const canonical = `${baseUrl}/blog/${article.slug}`;
  const title = `${article.title} — FindMyDoctor.ae`;
  const description = article.description || '';

  const alternates = SITE_LOCALES.map(loc => ({
    rel: 'alternate', hrefLang: loc, href: `${baseUrl}/blog/${article.slug}`,
  })).concat([{ rel: 'alternate', hrefLang: 'x-default', href: `${baseUrl}/blog/${article.slug}` }]);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    inLanguage: article.locale,
    datePublished: article.updated_at,
    dateModified: article.updated_at,
    author: { '@type': 'Organization', name: 'Dubai Medical Directory' },
    publisher: { '@type': 'Organization', name: 'FindMyDoctor.ae', logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` } },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        {alternates.map(a => <link key={a.hrefLang} rel={a.rel} hrefLang={a.hrefLang} href={a.href} />)}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      </Head>

      <SiteHeader />

      <article className="container-wide py-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">FindMyDoctor.ae</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground line-clamp-1">{article.title}</span>
        </div>

        <header className="mb-8">
          {article.translation_pending && (
            <Badge variant="info" className="mb-3">Traduction en cours — version française affichée</Badge>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{article.title}</h1>
          {description && <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <Calendar className="h-4 w-4" />
            <time dateTime={article.updated_at}>
              {new Date(article.updated_at).toLocaleDateString(currentLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
        </header>

        <div className="prose prose-slate max-w-none">
          {renderMarkdown(article.body)}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {t('blog.back_to_list') || 'Retour au blog'}
          </Link>
        </div>
      </article>
    </div>
  );
}
