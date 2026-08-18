import * as React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MapPin, Phone, Calendar, Star, Clock, MessageCircle, ChevronLeft, ShieldCheck, Building2, Activity, Share2, Bookmark, X, Check } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import pool from '../../lib/db';
import { pageTitle, pageDescription, physicianJsonLd, breadcrumbJsonLd, pageUrl, SITE_DESCRIPTION } from '../../lib/seo';
import { getProStats } from '../../lib/proStats';

const OG_LOCALE_MAP = { fr: 'fr_AE', en: 'en_AE', ar: 'ar_AE', zh: 'zh_CN', ru: 'ru_RU', fa: 'fa_IR' };

export async function getServerSideProps({ query, req, locale }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  const { slug, id: idParam } = query;
  const id = idParam || (slug ? String(slug).split('-').pop() : null);
  if (!id || !/^\d+$/.test(id)) {
    return { props: { pro: null, related: [], baseUrl: pageUrl(req.headers.host, '/'), ...(await serverSideTranslations(locale, ['common'])) } };
  }
  try {
    const r = await pool.query(
      `SELECT d.id, d.name, d.specialty, d.facility_name,
              COALESCE(u.bio_fr, pr.bio_fr) AS bio_fr,
              COALESCE(u.phone, pr.phone) AS phone,
              pr.phone_source,
              pr.dha_unique_id
           FROM public.dentists d
           LEFT JOIN dmd.professional pr ON d.name = pr.full_name
           LEFT JOIN dmd.users u ON u.dha_license = pr.dha_unique_id
          WHERE d.id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    const pro = r.rows[0] || null;
    let related = [];
    let stats = { views: 0, whatsappClicks: 0, avgRating: 0, totalReviews: 0 };
    if (pro) {
      const rel = await pool.query(
        `SELECT id, name, specialty FROM public.dentists
          WHERE specialty = $1 AND id != $2
          ORDER BY search_rank DESC NULLS LAST, id LIMIT 4`,
        [pro.specialty, pro.id]
      );
      related = rel.rows;
      stats = await getProStats(pool, pro);
    }
    return { props: { pro, related, stats, baseUrl: pageUrl(req.headers.host, '/'), ...(await serverSideTranslations(locale, ['common'])) } };
  } catch (e) {
    console.error('dentist [slug] getServerSideProps error:', e.message);
    return { props: { pro: null, related: [], stats: { views: 0, whatsappClicks: 0, avgRating: 0, totalReviews: 0 }, baseUrl: pageUrl(req.headers.host, '/'), ...(await serverSideTranslations(locale, ['common'])) } };
  }
}

export default function DentistProfile({ pro, related, stats, baseUrl }) {
  const [showRdv, setShowRdv] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [rdvSent, setRdvSent] = useState(false);
  const [rdvDate, setRdvDate] = useState('');
  const [rdvReason, setRdvReason] = useState('');
  const { t, i18n } = useTranslation('common');
  // Track profile view on mount (fire-and-forget)
  React.useEffect(() => {
    if (!pro || !pro.id) return;
    try {
      fetch('/api/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dentist', id: pro.id }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [pro?.id]);

  // Fire-and-forget click tracker for phone / email / website
  const trackClick = (click_type) => {
    if (!pro || !pro.id) return;
    try {
      fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dentist', id: pro.id, click_type }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };
  const localePrefix = `/${i18n.language || 'en'}`;

  if (!pro) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader isDentist={true} />
        <div className="container-wide py-32 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-extrabold mb-4">{t('dentist.not_found', 'Dentiste introuvable')}</h1>
          <p className="text-muted-foreground mb-6">{t('review.not_found_body', "Ce profil n'existe pas dans notre annuaire.")}</p>
          <Link href={`${localePrefix}/dentist`}>
            <Button size="lg"><ChevronLeft className="h-4 w-4" /> {t('dentist.back_to_list', 'Retour à la liste')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const facility = pro.facility_name || 'Clinique privée à Dubai';
  const specialty = pro.specialty || 'Dentiste généraliste';
  const fullName = pro.name || 'Dentiste';
  const proUrl = `${baseUrl}/dentist/${pro.id}`;
  const phone = pro.phone || null;
  const waPhone = phone ? String(phone).replace(/[^0-9]/g, '') : null;

  const title = pageTitle(`${fullName} - Dentiste ${specialty} Dubai`, true);
  const description = pageDescription(
    `${fullName}, ${specialty} DHA-licensé${pro.name?.endsWith('a') ? 'e' : ''} à ${facility}, Dubai. `
    + `Profil vérifié, prise de RDV, blanchiment, esthétique dentaire. Annuaire FindMyDentist.ae.`
  );
  const ogImage = `${baseUrl}/api/og/dentist/${pro.id}`;

  // For dentists we use Dentist type
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: fullName,
    url: proUrl,
    medicalSpecialty: specialty,
    identifier: pro.dha_unique_id || `dha-d-${pro.id}`,
    affiliation: pro.facility_name
      ? { '@type': 'Dentist', name: pro.facility_name }
      : undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
  };
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Annuaire', url: baseUrl },
    { name: specialty, url: `${baseUrl}/dentist?q=${encodeURIComponent(specialty)}` },
    { name: fullName, url: proUrl },
  ], baseUrl);

  const handleRdv = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!waPhone) return; // no phone: keep modal open as fallback
    const messages = {'fr': 'Bonjour Dr {name}, je vous contacte via {site} ({host}) pour un(e) {specialty}. Date souhaitée : {date}. Motif : {reason}. Est-ce que vous avez des disponibilités cette semaine ?', 'en': 'Hello Dr {name}, I am reaching out via {site} ({host}) for a {specialty} consultation. Preferred date: {date}. Reason: {reason}. Do you have availability this week?', 'ar': 'مرحباً د. {name}، أتواصل معك عبر {site} ({host}) بخصوص استشارة في {specialty}. التاريخ المفضل: {date}. السبب: {reason}. هل لديكِ مواعيد متاحة هذا الأسبوع؟', 'zh': '您好 {name} 医生，我通过 {site} ({host}) 联系您咨询 {specialty}。期望日期：{date}。原因：{reason}。本周有可预约时间吗？', 'ru': 'Здравствуйте, д-р {name}. Я обращаюсь через {site} ({host}) по вопросу {specialty}. Желаемая дата: {date}. Причина: {reason}. Есть ли у вас свободные места на этой неделе?', 'fa': 'سلام دکتر {name}، از طریق {site} ({host}) با شما تماس می\u200cگیرم برای {specialty}. تاریخ مورد نظر: {date}. دلیل: {reason}. آیا این هفته نوبت خالی دارید؟'};
    const locale = (typeof window !== 'undefined' && (window.localStorage?.getItem('NEXT_LOCALE') || document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1])) || 'en';
    const template = messages[locale] || messages.en;
    const text = template
      .replace('{name}', fullName)
      .replace('{site}', 'FindMyDentist.ae')
      .replace('{host}', 'findmydentist.ae')
      .replace('{specialty}', specialty)
      .replace('{date}', rdvDate)
      .replace('{reason}', rdvReason);
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setRdvSent(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={proUrl} />

        <meta property="og:type" content="profile" />
        <meta property="og:url" content={proUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="FindMyDentist.ae" />
        <meta property="og:locale" content={OG_LOCALE_MAP[i18n.language] || OG_LOCALE_MAP.en} />
        {Object.entries(OG_LOCALE_MAP).filter(([code]) => code !== (i18n.language || 'en')).map(([code, val]) => (
          <meta key={code} property="og:locale:alternate" content={val} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="alternate" hrefLang="fr" href={`${baseUrl}/fr/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="ar" href={`${baseUrl}/ar/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="zh" href={`${baseUrl}/zh/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="ru" href={`${baseUrl}/ru/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="fa" href={`${baseUrl}/fa/dentist/${pro.id}`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en/dentist/${pro.id}`} />

        {jsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
        {breadcrumb && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        )}
      </Head>

      <SiteHeader isDentist={true} />

      <div className="container-wide pt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dentist" className="hover:text-cyan-600">{t('dentist.detail.directory', 'Annuaire')}</Link>
          <span>/</span>
          <span>{specialty}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{fullName}</span>
        </nav>
      </div>

      <section className="container-wide py-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <Avatar name={fullName} size="2xl" verified className="ring-4 ring-white/30" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{fullName}</h1>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge variant="info" className="bg-white/20 text-white border-0">
                        <Activity className="h-3 w-3" /> {specialty}
                      </Badge>
                      <Badge variant="verified" className="bg-emerald-500/20 text-white border-0">
                        <ShieldCheck className="h-3 w-3" /> DHA Vérifié
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{facility}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowShare(true)} className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center" aria-label={t('dentist.detail.aria_share', 'Partager')}>
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center" aria-label={t('dentist.detail.aria_save', 'Sauvegarder')}>
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={"w-3.5 h-3.5 " + (i <= Math.round(stats.avgRating) ? "fill-amber-400 text-amber-400" : "text-amber-400/30")} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{stats.totalReviews > 0 ? `${stats.avgRating}/5 (${stats.totalReviews})` : t('doctor.rating_keys.no_reviews')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-3 flex-wrap">
            <Button size="lg" className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-700" onClick={waPhone ? handleRdv : () => setShowRdv(true)}>
              <Calendar className="h-4 w-4" /> {t('dentist.book', 'Prendre rendez-vous')}
            </Button>
            <Button variant="outline" size="lg" className="flex-1 md:flex-none" onClick={() => setShowMsg(true)}>
              <MessageCircle className="h-4 w-4" /> {t('dentist.message', 'Envoyer un message')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 md:flex-none"
              disabled={!waPhone}
              title={waPhone ? '' : t('dentist.detail.no_phone', 'Aucun numéro de téléphone')}
              onClick={() => { trackClick('phone'); window.location.href = `tel:+${waPhone}`; }}
            >
              <Phone className="h-4 w-4" /> {t('dentist.detail.call', 'Appeler')}
            </Button>
            <WhatsAppButton
              phone={pro.phone || null}
              proName={fullName}
              specialty={specialty}
              locale={i18n.language || 'en'}
              variant="primary"
              proType="dentist"
              proId={pro.id}
            />
          </div>
        </Card>
      </section>

      <section className="container-wide pb-12 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">{t('dentist.about', 'À propos')} Dr. {fullName.split(' ').slice(-1)[0]}</h2>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              {t('dentist.detail.bio_template', "Dr. {name} est {specialty} DHA-licensé(e) exerçant à {facility}, Dubai, Émirats Arabes Unis. Profil vérifié directement via le Dubai Health Authority (Sheryan). {specialty} expérimenté(e), spécialisé(e) dans les soins dentaires de qualité.")
                .replaceAll('{name}', fullName)
                .replaceAll('{specialty}', specialty)
                .replaceAll('{facility}', facility)}
            </p>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">{t('dentist.specialty', 'Soins et services')}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{specialty}</Badge>
              <Badge variant="info">{t('dentist.detail.tag_4', 'Détartrage')}</Badge>
              <Badge variant="info">{t('dentist.detail.tag_1', 'Blanchiment')}</Badge>
              <Badge variant="info">{t('dentist.detail.tag_2', 'Carie')}</Badge>
              <Badge variant="info">{t('dentist.detail.tag_3', 'Consultation')}</Badge>
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">{t('doctor.facility', 'Établissement')}</h2>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{facility}</h3>
                <p className="text-sm text-muted-foreground">📍 {t('dentist.detail.uae_location', 'Dubai, Émirats Arabes Unis')}</p>
              </div>
              <Button variant="outline" size="sm">{t('dentist.detail.view', 'Voir')}</Button>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <Badge variant="premium" className="mb-3">⭐ Premium</Badge>
            <h3 className="font-bold text-lg mb-2">{t('dentist.detail.premium_verified_title', 'Profil vérifié premium')}</h3>
            <Link href="/dashboard/login"><Button variant="premium" className="w-full">{t('nav.signup', 'Activer mon profil')} →</Button></Link>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold mb-4">{t('dentist.detail.stats_title', 'Statistiques')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t('dentist.detail.stats_views_label', '👁️ Vues (30j)')}</span><span className="font-bold">{stats.views}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t('dentist.detail.stats_contacts_label', '💬 Contacts WhatsApp (30j)')}</span><span className="font-bold">{stats.whatsappClicks}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t('dentist.detail.stats_rating_label', '⭐ Note moyenne')}</span><span className="font-bold">{stats.totalReviews > 0 ? `${stats.avgRating}/5` : '—'}</span></div>
            </div>
            {stats.views === 0 && stats.whatsappClicks === 0 && stats.totalReviews === 0 && (
              <p className="text-xs text-muted-foreground mt-3">{t('dentist.detail.stats_no_data', 'Pas encore de donnees')}</p>
            )}
          </Card>
        </div>
      </section>

      {related.length > 0 && (
      <section className="container-wide pb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6">{t('dentist.detail.similar_dubai', 'Dentistes similaires à Dubai')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map(p => (
            <Link key={p.id} href={`/dentist?id=${p.id}`} className="group bg-white border border-border rounded-xl p-4 hover:shadow-lg transition-all">
              <Avatar name={p.name} size="lg" className="mb-3" verified />
              <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.specialty}</p>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Mobile sticky bottom CTA bar - shown for ALL dentists (WhatsApp if phone, else RDV+Message) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-border/60 px-4 py-3 flex items-center gap-3 shadow-2xl animate-fade-in">
        {waPhone ? (
          <>
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent('Bonjour Dr. ' + fullName + ', je vous contacte depuis FindMyDentist.ae')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold rounded-xl py-3.5 text-sm min-h-[44px] hover:bg-emerald-600 transition-colors animate-pulse-slow"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a onClick={() => trackClick('phone')} href={`tel:+${waPhone}`} className="flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-muted hover:bg-muted/80 transition-colors" aria-label={t('dentist.detail.call', 'Appeler')}>
              <Phone className="h-5 w-5" />
            </a>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowRdv(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold rounded-xl py-3.5 text-sm min-h-[44px] hover:bg-cyan-700 transition-colors"
              aria-label={t('dentist.book', 'Prendre rendez-vous')}
            >
              <Calendar className="h-5 w-5" />
              {t('dentist.book', 'Prendre rendez-vous')}
            </button>
            <button
              onClick={() => setShowMsg(true)}
              className="flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              aria-label={t('dentist.message', 'Envoyer un message')}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {showRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRdv(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{t('dentist.book', 'Prendre rendez-vous')}</h2>
              <button onClick={() => setShowRdv(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label={t('common.close', 'Fermer')}><X className="h-4 w-4" /></button>
            </div>
            {rdvSent ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-emerald-600" /></div>
                <h3 className="text-lg font-bold mb-1">{t('dentist.detail.rdv_sent_title', 'Demande envoyée !')}</h3>
                <p className="text-sm text-muted-foreground">{t('dentist.detail.will_contact_24h', '{name} vous recontactera dans les 24h.').replace('{name}', fullName)}</p>
              </div>
            ) : (
              <form onSubmit={handleRdv} className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('dentist.detail.rdv_with', 'avec')} <strong className="text-foreground">Dr. {fullName}</strong> · {specialty}</p>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('dentist.detail.rdv_date_label', 'Date souhaitée')}</label>
                  <input type="date" required value={rdvDate} onChange={e => setRdvDate(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('dentist.detail.rdv_reason_label', 'Motif')}</label>
                  <textarea required value={rdvReason} onChange={e => setRdvReason(e.target.value)} placeholder={t('dentist.detail.rdv_reason_placeholder', 'Décrivez brièvement le motif...')} rows={3} className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowRdv(false)} className="flex-1">{t('common.cancel', 'Annuler')}</Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">{t('dentist.detail.rdv_submit', 'Envoyer la demande')}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMsg(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{t('dentist.message', 'Envoyer un message')}</h2>
              <button onClick={() => setShowMsg(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label={t('common.close', 'Fermer')}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('dentist.detail.msg_to', 'à')} <strong className="text-foreground">Dr. {fullName}</strong></p>
            <textarea placeholder={t('dentist.detail.msg_placeholder', 'Posez votre question…')} rows={5} className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-4" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowMsg(false)} className="flex-1">{t('common.cancel', 'Annuler')}</Button>
              <Button className="flex-1" disabled>{t('dentist.detail.msg_submit', 'Envoyer (connexion requise)')}</Button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{t('dentist.detail.share_title', 'Partager le profil de Dr. {name}').replace('{name}', fullName)}</h2>
              <button onClick={() => setShowShare(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label={t('common.close', 'Fermer')}><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <input readOnly value={proUrl} className="flex-1 h-11 rounded-md border border-input bg-muted px-4 py-2 text-sm" onClick={e => e.target.select()} />
              <Button onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(proUrl); }}>{t('dentist.detail.copy_button', 'Copier')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
