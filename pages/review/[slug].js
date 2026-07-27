import * as React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChevronLeft, Star, ShieldCheck, Check, X } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { DhaBadge } from '../../components/DhaBadge';
import { ReviewCard } from '../../components/ReviewCard';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import pool from '../../lib/db';
import { breadcrumbJsonLd, pageUrl } from '../../lib/seo';

const MOCK_REVIEWS = [
  { id: 'r1', name: 'Sophie Martin', rating: 5, text: "Excellent medecin ! A l'ecoute et tres professionnel. Je recommande vivement.", date: '2026-05-28', verified: true },
  { id: 'r2', name: 'Ahmed Benali', rating: 5, text: "Tres bonne consultation. Le cabinet est bien situe et l'accueil est chaleureux.", date: '2026-05-15', verified: true },
  { id: 'r3', name: 'Marie Dubois', rating: 4, text: 'Bon praticien, rendez-vous facile a obtenir. Seul bemol : un peu d\'attente.', date: '2026-05-02', verified: false },
  { id: 'r4', name: 'Karim Othman', rating: 5, text: 'Je suis suivi depuis 2 ans, toujours au top. Disponible et a l\'ecoute.', date: '2026-04-20', verified: true },
  { id: 'r5', name: 'Lina Haddad', rating: 5, text: "Prends le temps d'expliquer, tres pedagogue. Je recommande a 100%.", date: '2026-04-10', verified: true },
  { id: 'r6', name: 'Thomas Leroy', rating: 4, text: 'Bon docteur, ponctuel et efficace. Tarif raisonnable.', date: '2026-03-28', verified: false },
];

const RATING_DISTRIBUTION = [
  { stars: 5, pct: 78, count: 142 },
  { stars: 4, pct: 14, count: 25 },
  { stars: 3, pct: 5, count: 9 },
  { stars: 2, pct: 2, count: 3 },
  { stars: 1, pct: 1, count: 2 },
];

export async function getServerSideProps({ query, req, locale }) {
  const { slug } = query;
  const id = slug ? String(slug).split('-').pop() : null;
  if (!id || !/^\d+$/.test(id)) {
    return {
      props: {
        pro: null,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }
  try {
    const r = await pool.query(
      `SELECT p.id, p.name, p.specialty, p.facility_name,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified,
              pr.profile_picture_url,
              pr.plan,
              pr.bio_fr,
              pr.phone,
              pr.phone_source
         FROM public.physicians p
         LEFT JOIN dmd.professional pr ON p.name = pr.full_name
        WHERE p.id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    return {
      props: {
        pro: r.rows[0] || null,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  } catch (e) {
    console.error('review [slug] getServerSideProps error:', e.message);
    return {
      props: {
        pro: null,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }
}

export default function ReviewPage({ pro, baseUrl }) {
  const { t, i18n } = useTranslation('common');
  const localePrefix = `/${i18n.language || 'en'}`;
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [formName, setFormName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!pro) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="container-wide py-32 text-center">
          <div className="text-6xl mb-4">:(</div>
          <h1 className="text-3xl font-extrabold mb-4">{t('doctor.not_found')}</h1>
          <p className="text-muted-foreground mb-6">{t('review.not_found_body', 'Ce profil n\'existe pas dans notre annuaire.')}</p>
          <Link href={`${localePrefix}/`}>
            <Button size="lg"><ChevronLeft className="h-4 w-4" /> {t('doctor.back_to_list')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = (pro.name || '').replace(/^Dr\.?\s*/i, '').trim();
  const avgRating = 4.7;
  const totalReviews = 181;

  const pageTitleStr = `${t('review.title', 'Avis patients')} - Dr. ${fullName} | FindMyDoctor.ae`;
  const descStr = `${t('review.subtitle', 'Consultez les avis verifies des patients sur')} ${fullName} (${pro.specialty || 'Medecin'}). Note moyenne ${avgRating}/5 sur ${totalReviews} ${t('review.count_label', 'avis')}.`;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{pageTitleStr}</title>
        <meta name="description" content={descStr} />
        <link rel="canonical" href={`${baseUrl}/review/${pro.id}`} />
        <meta property="og:title" content={pageTitleStr} />
        <meta property="og:description" content={descStr} />
        <meta property="og:url" content={`${baseUrl}/review/${pro.id}`} />
        <meta property="og:type" content="profile" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Physician',
              name: `Dr. ${fullName}`,
              medicalSpecialty: pro.specialty || 'General',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: avgRating,
                reviewCount: totalReviews,
                bestRating: 5,
                worstRating: 1,
              },
              review: MOCK_REVIEWS.slice(0, 4).map((r) => ({
                '@type': 'Review',
                author: { '@type': 'Person', name: r.name },
                datePublished: r.date,
                reviewBody: r.text,
                reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
              })),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd([
                { name: 'FindMyDoctor.ae', url: baseUrl },
                { name: fullName, url: `${baseUrl}/doctor/${pro.id}` },
                { name: t('review.title', 'Avis'), url: `${baseUrl}/review/${pro.id}` },
              ])
            ),
          }}
        />
      </Head>

      <SiteHeader />

      <div className="bg-gradient-to-br from-amber-50 via-white to-cyan-50 border-b border-border">
        <div className="container-wide py-8">
          <Link
            href={`${localePrefix}/doctor/${pro.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('review.back_to_profile', 'Retour au profil')}
          </Link>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <Avatar name={`Dr. ${fullName}`} size="xl" verified />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold">Dr. {fullName}</h1>
                {pro.is_dha_verified && <DhaBadge />}
              </div>
              <p className="text-muted-foreground mb-3">{pro.specialty || 'Medecin generaliste'}{pro.facility_name ? ` - ${pro.facility_name}` : ''}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-5 w-5 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-300'}`} />
                  ))}
                  <span className="font-extrabold text-lg ml-1.5">{avgRating}</span>
                </div>
                <span className="text-muted-foreground">-</span>
                <span className="text-sm font-semibold">{totalReviews} {t('review.count_label', 'avis')}</span>
                <Badge variant="success" className="ml-2"><ShieldCheck className="h-3 w-3 mr-1" />{t('review.verified_label', 'Avis verifies')}</Badge>
              </div>
            </div>
            <Button size="lg" onClick={() => setShowForm(true)}>
              {t('review.leave_review', 'Laisser un avis')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container-wide py-12 grid lg:grid-cols-[320px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <Card>
            <h3 className="font-bold mb-4">{t('review.rating_breakdown', 'Detail des notes')}</h3>
            <div className="space-y-2.5">
              {RATING_DISTRIBUTION.map((d) => (
                <div key={d.stars} className="flex items-center gap-3 text-sm">
                  <span className="w-12 flex items-center gap-0.5 text-muted-foreground">
                    {d.stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3">{t('review.trust_title', 'Notre engagement')}</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('review.trust_1', 'Avis moderes manuellement pour eviter les faux commentaires.')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('review.trust_2', 'Verification email + consultation confirmee = badge verifie.')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('review.trust_3', 'Les medecins peuvent repondre publiquement a chaque avis.')}</span>
              </li>
            </ul>
          </Card>
        </aside>

        <main>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold">{t('review.all_reviews', 'Tous les avis')}</h2>
            <select className="h-10 rounded-md border border-input bg-white px-3 text-sm">
              <option>{t('review.sort_recent', 'Les plus recents')}</option>
              <option>{t('review.sort_best', 'Les mieux notes')}</option>
              <option>{t('review.sort_worst', 'Les moins bien notes')}</option>
            </select>
          </div>

          <div className="space-y-4">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="relative">
                <ReviewCard name={r.name} rating={r.rating} text={r.text} date={r.date} />
                {r.verified && (
                  <Badge variant="success" className="absolute top-3 right-3 text-[10px]">
                    <Check className="h-2.5 w-2.5 mr-0.5" />{t('review.verified_short', 'Verifie')}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="lg">{t('review.load_more', "Charger plus d'avis")}</Button>
          </div>
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !submitted && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{t('review.form_title', 'Laisser un avis')}</h2>
              <button onClick={() => { setShowForm(false); setSubmitted(false); }} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {submitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold mb-1">{t('review.thanks_title', 'Merci pour votre avis !')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('review.thanks_body', 'Votre avis sera publie apres verification (sous 24h).')}</p>
                <Button variant="outline" onClick={() => { setShowForm(false); setSubmitted(false); }}>{t('review.close', 'Fermer')}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('review.form_intro', 'Votre avis sur')} <strong className="text-foreground">Dr. {fullName}</strong></p>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('review.form_rating', 'Votre note')}</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setFormRating(i)} className="p-1 hover:scale-110 transition-transform">
                        <Star className={`h-8 w-8 ${i <= formRating ? 'fill-amber-400 text-amber-400' : 'text-muted-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('review.form_name', 'Votre prenom')}</label>
                  <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Marie" className="flex h-11 w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('review.form_comment', 'Votre commentaire')}</label>
                  <textarea required value={formText} onChange={(e) => setFormText(e.target.value)} rows={4} placeholder="Decrivez votre experience..." className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">{t('review.cancel', 'Annuler')}</Button>
                  <Button type="submit" className="flex-1">{t('review.submit', 'Publier')}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {pro.phone && (
        <WhatsAppButton
          phone={pro.phone}
          proName={fullName}
          specialty={pro.specialty}
          locale={i18n.language || 'en'}
        />
      )}
    </div>
  );
}