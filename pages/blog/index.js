import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BookOpen, Calendar, ArrowRight, ChevronRight } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { listArticles } from '../../lib/blog';

const SITE_LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];

export async function getServerSideProps({ locale, req }) {
  const baseUrl = `https://${req.headers.host}`;
  const articles = listArticles(locale || 'fr');
  return {
    props: {
      articles,
      baseUrl,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

function stripMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function BlogIndex({ articles, baseUrl }) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const currentLocale = i18n.language || 'fr';
  const title = `${t('blog.title') || 'Blog'} — FindMyDoctor.ae`;
  const description = t('blog.description') || 'Articles et guides santé pour expatriés à Dubai';

  return (
    <div className="min-h-screen bg-muted/30">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${baseUrl}/blog`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Head>

      <SiteHeader />

      <section className="container-wide py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">FindMyDoctor.ae</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Blog</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t('blog.title') || 'Blog santé'}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {articles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Aucun article disponible pour le moment.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(a => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group">
                <Card className="h-full p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3.5 w-3.5" />
                    <time dateTime={a.updated_at}>
                      {new Date(a.updated_at).toLocaleDateString(currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </time>
                    {a.translation_pending && (
                      <Badge variant="info" className="ml-auto text-xs">Traduction en cours</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{a.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{a.description || stripMarkdown(a.body).slice(0, 200)}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                    {t('blog.read_more') || "Lire l'article"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
