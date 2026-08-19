import * as React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChevronLeft, Star, Check, X } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { DhaBadge } from '../../components/DhaBadge';
import { ReviewCard } from '../../components/ReviewCard';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import pool from '../../lib/db';
import { breadcrumbJsonLd, pageUrl } from '../../lib/seo';

export async function getServerSideProps({ query, req, locale }) {
  const { slug } = query;
  const id = slug ? String(slug).split('-').pop() : null;
  const isDentist = (req.headers.host || '').includes('findmydentist');
  if (!id || !/^\d+$/.test(id)) {
    return {
      props: {
        pro: null,
        isDentist,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }
  try {
    // The review page is a shared route (middleware.js excludes /review from
    // the host-based rewrite), so the same [slug].js handles both doctor and
    // dentist reviews - it must query whichever table `isDentist` points to,
    // not always physicians. `sourceTable` is never user input (derived from
    // req.headers.host above), so interpolating it is safe.
    const sourceTable = isDentist ? 'dentists' : 'physicians';
    const r = await pool.query(
      `SELECT p.id, p.name, p.specialty, p.facility_name,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified,
              COALESCE(u.photo_url, pr.profile_picture_url) AS profile_picture_url,
              COALESCE(u.plan, pr.plan, 'free') AS plan,
              COALESCE(u.bio_fr, pr.bio_fr) AS bio_fr,
              COALESCE(u.phone, pr.phone) AS phone,
              pr.phone_source,
              pr.dha_unique_id
         FROM public.${sourceTable} p
         LEFT JOIN LATERAL (
           SELECT pr2.*
             FROM dmd.professional pr2
            WHERE pr2.full_name = p.name
            ORDER BY (pr2.specialty = p.specialty) DESC NULLS LAST,
                     pr2.is_dha_verified DESC NULLS LAST,
                     pr2.dha_unique_id ASC
            LIMIT 1
         ) pr ON true
         LEFT JOIN dmd.users u ON u.dha_license = pr.dha_unique_id
        WHERE p.id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    const pro = r.rows[0] || null;

    let reviews = [];
    let avgRating = 0;
    let totalReviews = 0;
    let ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, pct: 0 }));

    if (pro && pro.dha_unique_id) {
      const rv = await pool.query(
        `SELECT id, rating, text, author_name, verified, visit_date, created_at,
                response_text, response_at
           FROM dmd.reviews
          WHERE pro_dha_id = $1
          ORDER BY created_at DESC
          LIMIT 20`,
        [pro.dha_unique_id]
      );
      reviews = rv.rows;

      const agg = await pool.query(
        `SELECT COUNT(*)::int AS total, COALESCE(AVG(rating), 0)::float AS avg,
                COUNT(*) FILTER (WHERE rating = 5)::int AS c5,
                COUNT(*) FILTER (WHERE rating = 4)::int AS c4,
                COUNT(*) FILTER (WHERE rating = 3)::int AS c3,
                COUNT(*) FILTER (WHERE rating = 2)::int AS c2,
                COUNT(*) FILTER (WHERE rating = 1)::int AS c1
           FROM dmd.reviews
          WHERE pro_dha_id = $1`,
        [pro.dha_unique_id]
      );
      const a = agg.rows[0];
      totalReviews = a.total;
      avgRating = totalReviews > 0 ? Math.round(a.avg * 10) / 10 : 0;
      const counts = { 5: a.c5, 4: a.c4, 3: a.c3, 2: a.c2, 1: a.c1 };
      ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: counts[stars],
        pct: totalReviews > 0 ? Math.round((counts[stars] / totalReviews) * 100) : 0,
      }));
    }

    return {
      props: {
        pro,
        reviews,
        avgRating,
        totalReviews,
        ratingDistribution,
        isDentist,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  } catch (e) {
    console.error('review [slug] getServerSideProps error:', e.message);
    return {
      props: {
        pro: null,
        reviews: [],
        avgRating: 0,
        totalReviews: 0,
        ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, pct: 0 })),
        isDentist,
        baseUrl: pageUrl(req.headers.host, '/'),
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }
}

export default function ReviewPage({ pro, reviews, avgRating, totalReviews, ratingDistribution, baseUrl, isDentist }) {
  const { t, i18n } = useTranslation('common');
  const localePrefix = `/${i18n.language || 'en'}`;
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [formName, setFormName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canReview = Boolean(pro && pro.dha_unique_id);

  if (!pro) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader isDentist={isDentist} />
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

  const pageTitleStr = `${t('review.title', 'Avis patients')} - Dr. ${fullName} | FindMyDoctor.ae`;
  const descStr = totalReviews > 0
    ? `${t('review.subtitle', 'Consultez les avis verifies des patients sur')} ${fullName} (${pro.specialty || 'Medecin'}). Note moyenne ${avgRating}/5 sur ${totalReviews} ${t('review.count_label', 'avis')}.`
    : `${t('review.subtitle', 'Consultez les avis verifies des patients sur')} ${fullName} (${pro.specialty || 'Medecin'}).`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !canReview) return;
    setFormError('');

    if (formText.trim().length < 10) {
      setFormError(t('review.error_text_short', 'Votre avis est trop court (10 caracteres minimum).'));
      return;
    }
    if (formText.trim().length > 2000) {
      setFormError(t('review.error_text_long', 'Votre avis est trop long (2000 caracteres maximum).'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pro_dha_id: pro.dha_unique_id,
          rating: formRating,
          text: formText.trim(),
          author_name: formName.trim() || undefined,
          language: i18n.language || 'en',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setFormError(data.error || t('review.error_generic', 'Une erreur est survenue. Veuillez reessayer.'));
        setIsSubmitting(false);
        return;
      }
      setSubmitted(true);
      setIsSubmitting(false);
    } catch {
      setFormError(t('review.error_generic', 'Une erreur est survenue. Veuillez reessayer.'));
      setIsSubmitting(false);
    }
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
              '@type': isDentist ? 'Dentist' : 'Physician',
              name: `Dr. ${fullName}`,
              medicalSpecialty: pro.specialty || 'General',
              // Only emit aggregateRating/review when real reviews exist —
              // fabricated ratings violate Google's structured data guidelines.
              ...(totalReviews > 0 ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: avgRating,
                  reviewCount: totalReviews,
                  bestRating: 5,
                  worstRating: 1,
                },
                review: reviews.slice(0, 4).map((r) => ({
                  '@type': 'Review',
                  author: { '@type': 'Person', name: r.author_name || 'Patient' },
                  datePublished: (r.visit_date || r.created_at || '').toString().slice(0, 10),
                  reviewBody: r.text,
                  reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
                })),
              } : {}),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd([
                { name: 'FindMyDoctor.ae', url: baseUrl },
                { name: fullName, url: `${baseUrl}/${isDentist ? 'dentist' : 'doctor'}/${pro.id}` },
                { name: t('review.title', 'Avis'), url: `${baseUrl}/review/${pro.id}` },
              ])
            ),
          }}
        />
      </Head>

      <SiteHeader isDentist={isDentist} />

      <div className="bg-gradient-to-br from-amber-50 via-white to-cyan-50 border-b border-border">
        <div className="container-wide py-8">
          <Link
            href={`${localePrefix}/${isDentist ? 'dentist' : 'doctor'}/${pro.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('review.back_to_profile', 'Retour au profil')}
          </Link>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <Avatar name={`Dr. ${fullName}`} size="xl" verified={pro.is_dha_verified === true} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold">Dr. {fullName}</h1>
                {pro.is_dha_verified && <DhaBadge />}
              </div>
              <p className="text-muted-foreground mb-3">{pro.specialty || 'Medecin generaliste'}{pro.facility_name ? ` - ${pro.facility_name}` : ''}</p>
              {totalReviews > 0 ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`h-5 w-5 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-300'}`} />
                    ))}
                    <span className="font-extrabold text-lg ml-1.5">{avgRating}</span>
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-sm font-semibold">{totalReviews} {t('review.count_label', 'avis')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 text-muted-300" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{t('review.no_reviews_yet', 'Pas encore d\'avis - soyez le premier')}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button size="lg" onClick={() => setShowForm(true)} disabled={!canReview} title={canReview ? '' : t('review.unavailable', "Les avis ne sont pas encore disponibles pour ce profil.")}>
                {t('review.leave_review', 'Laisser un avis')}
              </Button>
              {!canReview && (
                <span className="text-xs text-muted-foreground max-w-[220px] text-right">
                  {t('review.unavailable', "Les avis ne sont pas encore disponibles pour ce profil.")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide py-12 grid lg:grid-cols-[320px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <Card>
            <h3 className="font-bold mb-4">{t('review.rating_breakdown', 'Detail des notes')}</h3>
            <div className="space-y-2.5">
              {ratingDistribution.map((d) => (
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

          {reviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    name={r.author_name || t('review.anonymous', 'Patient')}
                    rating={r.rating}
                    text={r.text}
                    date={(r.visit_date || r.created_at || '').toString().slice(0, 10)}
                    responseText={r.response_text}
                    responseAt={(r.response_at || '').toString().slice(0, 10)}
                  />
                ))}
              </div>
              {reviews.length >= 20 && (
                <div className="text-center mt-10">
                  <Button variant="outline" size="lg">{t('review.load_more', "Charger plus d'avis")}</Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-4xl mb-3">💬</div>
              <p>{t('review.no_reviews_yet', 'Pas encore d\'avis - soyez le premier')}</p>
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !submitted && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{t('review.form_title', 'Laisser un avis')}</h2>
              <button onClick={() => { setShowForm(false); setSubmitted(false); setFormError(''); setFormText(''); setFormName(''); setFormRating(5); }} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {submitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold mb-1">{t('review.thanks_title', 'Merci pour votre avis !')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('review.thanks_body', 'Votre avis est maintenant publie sur le profil.')}</p>
                <Button variant="outline" onClick={() => { setShowForm(false); setSubmitted(false); setFormError(''); setFormText(''); setFormName(''); setFormRating(5); }}>{t('review.close', 'Fermer')}</Button>
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
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Marie" className="flex h-11 w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('review.form_comment', 'Votre commentaire')}</label>
                  <textarea required minLength={10} maxLength={2000} value={formText} onChange={(e) => setFormText(e.target.value)} rows={4} placeholder="Decrivez votre experience..." className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1" disabled={isSubmitting}>{t('review.cancel', 'Annuler')}</Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? t('review.submitting', 'Envoi...') : t('review.submit', 'Publier')}
                  </Button>
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
