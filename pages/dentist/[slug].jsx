import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MapPin, Phone, Calendar, Star, Clock, MessageCircle, ChevronLeft, ShieldCheck, Building2, Activity, Share2, Bookmark, X, Check } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import pool from '../../lib/db';
import { pageTitle, pageDescription, physicianJsonLd, breadcrumbJsonLd, pageUrl, SITE_DESCRIPTION } from '../../lib/seo';

const RELATED = [
  { id: 'r1', name: 'Dr. Fatima Al-Mansouri', specialty: 'Orthodontiste' },
  { id: 'r2', name: 'Dr. Omar Khalil', specialty: 'Dentiste généraliste' },
  { id: 'r3', name: 'Dr. Maya Hassan', specialty: 'Esthétique dentaire' },
  { id: 'r4', name: 'Dr. Yassine Tazi', specialty: 'Implantologue' },
];

export async function getServerSideProps({ query, req }) {
  const { slug, id: idParam } = query;
  const id = idParam || (slug ? String(slug).split('-').pop() : null);
  if (!id || !/^\d+$/.test(id)) {
    return { props: { pro: null, baseUrl: pageUrl(req.headers.host, '/') } };
  }
  try {
    const r = await pool.query(
      `SELECT d.id, d.name, d.specialty, d.facility_name, pr.bio_fr
           FROM public.dentists d
           LEFT JOIN dmd.professional pr ON d.name = pr.full_name
          WHERE d.id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    return { props: { pro: r.rows[0] || null, baseUrl: pageUrl(req.headers.host, '/') } };
  } catch (e) {
    console.error('dentist [slug] getServerSideProps error:', e.message);
    return { props: { pro: null, baseUrl: pageUrl(req.headers.host, '/') } };
  }
}

export default function DentistProfile({ pro, baseUrl }) {
  const [showRdv, setShowRdv] = React.useState(false);
  const [showMsg, setShowMsg] = React.useState(false);
  const [showShare, setShowShare] = React.useState(false);
  const [rdvSent, setRdvSent] = React.useState(false);
  const [rdvDate, setRdvDate] = React.useState('');
  const [rdvReason, setRdvReason] = React.useState('');

  if (!pro) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="container-wide py-32 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-extrabold mb-4">Dentiste introuvable</h1>
          <p className="text-muted-foreground mb-6">Ce profil n'existe pas dans notre annuaire.</p>
          <Link href="/dentist">
            <Button size="lg"><ChevronLeft className="h-4 w-4" /> Retour à l'annuaire</Button>
          </Link>
        </div>
      </div>
    );
  }

  const facility = pro.facility_name || 'Clinique privée à Dubai';
  const specialty = pro.specialty || 'Dentiste généraliste';
  const fullName = pro.name || 'Dentiste';
  const proUrl = `${baseUrl}/dentist/${pro.id}`;

  const title = pageTitle(`${fullName} - Dentiste ${specialty} Dubai`);
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
    identifier: `dha-d-${pro.id}`,
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
    e.preventDefault();
    setRdvSent(true);
    setTimeout(() => {
      setShowRdv(false);
      setRdvSent(false);
      setRdvDate('');
      setRdvReason('');
    }, 2500);
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
        <meta property="og:locale" content="fr_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="alternate" hrefLang="fr-AE" href={proUrl} />
        <link rel="alternate" hrefLang="en-AE" href={`${proUrl}?lang=en`} />
        <link rel="alternate" hrefLang="ar-AE" href={`${proUrl}?lang=ar`} />
        <link rel="alternate" hrefLang="x-default" href={proUrl} />

        {jsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
        {breadcrumb && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        )}
      </Head>

      <SiteHeader />

      <div className="container-wide pt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dentist" className="hover:text-cyan-600">Annuaire</Link>
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
                    <button onClick={() => setShowShare(true)} className="h-10 w-10 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center" aria-label="Partager">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="h-10 w-10 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center" aria-label="Sauvegarder">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.8 (98 avis)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-3">
            <Button size="lg" className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowRdv(true)}>
              <Calendar className="h-4 w-4" /> Prendre rendez-vous
            </Button>
            <Button variant="outline" size="lg" className="flex-1 md:flex-none" onClick={() => setShowMsg(true)}>
              <MessageCircle className="h-4 w-4" /> Envoyer un message
            </Button>
            <Button variant="outline" size="lg" className="flex-1 md:flex-none">
              <Phone className="h-4 w-4" /> Appeler
            </Button>
          </div>
        </Card>
      </section>

      <section className="container-wide pb-12 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">À propos de Dr. {fullName.split(' ').slice(-1)[0]}</h2>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              Dr. {fullName} est {specialty.toLowerCase()} DHA-licensé(e) exerçant à {facility}, Dubai.
              Soins dentaires de qualité, approche douce, blanchiment, esthétique, implants.
            </p>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">Soins et services</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{specialty}</Badge>
              <Badge variant="info">Détartrage</Badge>
              <Badge variant="info">Blanchiment</Badge>
              <Badge variant="info">Carie</Badge>
              <Badge variant="info">Consultation</Badge>
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-4">Établissement</h2>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{facility}</h3>
                <p className="text-sm text-muted-foreground">📍 Dubai, Émirats Arabes Unis</p>
              </div>
              <Button variant="outline" size="sm">Voir</Button>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <Badge variant="premium" className="mb-3">⭐ Premium</Badge>
            <h3 className="font-bold text-lg mb-2">Profil vérifié premium</h3>
            <Link href="/dashboard/login"><Button variant="premium" className="w-full">Activer mon profil →</Button></Link>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold mb-4">Statistiques</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">👁️ Vues ce mois</span><span className="font-bold">847</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">📅 RDV pris</span><span className="font-bold">28</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">⭐ Note moyenne</span><span className="font-bold">4.8/5</span></div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container-wide pb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Dentistes similaires à Dubai</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {RELATED.map(p => (
            <Link key={p.id} href={`/dentist?id=${p.id}`} className="group bg-white border border-border rounded-xl p-4 hover:shadow-lg transition-all">
              <Avatar name={p.name} size="lg" className="mb-3" verified />
              <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.specialty}</p>
            </Link>
          ))}
        </div>
      </section>

      {showRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRdv(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">Prendre rendez-vous</h2>
              <button onClick={() => setShowRdv(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            {rdvSent ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-emerald-600" /></div>
                <h3 className="text-lg font-bold mb-1">Demande envoyée !</h3>
                <p className="text-sm text-muted-foreground">{fullName} vous recontactera dans les 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleRdv} className="space-y-4">
                <p className="text-sm text-muted-foreground">avec <strong className="text-foreground">Dr. {fullName}</strong> · {specialty}</p>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Date souhaitée</label>
                  <input type="date" required value={rdvDate} onChange={e => setRdvDate(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Motif</label>
                  <textarea required value={rdvReason} onChange={e => setRdvReason(e.target.value)} placeholder="Décrivez brièvement le motif..." rows={3} className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowRdv(false)} className="flex-1">Annuler</Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">Envoyer la demande</Button>
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
              <h2 className="text-xl font-extrabold">Envoyer un message</h2>
              <button onClick={() => setShowMsg(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">à <strong className="text-foreground">Dr. {fullName}</strong></p>
            <textarea placeholder="Posez votre question…" rows={5} className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-4" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowMsg(false)} className="flex-1">Annuler</Button>
              <Button className="flex-1" disabled>Envoyer (connexion requise)</Button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">Partager le profil de Dr. {fullName}</h2>
              <button onClick={() => setShowShare(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <input readOnly value={proUrl} className="flex-1 h-11 rounded-md border border-input bg-muted px-4 py-2 text-sm" onClick={e => e.target.select()} />
              <Button onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(proUrl); }}>Copier</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
