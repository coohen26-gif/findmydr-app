/**
 * pages/pricing.js
 * Public pricing page (same plans as /dashboard/upgrade, no auth required).
 */
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Check, X, Award, Building2, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { SiteHeader } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Badge } from '../components/Badge';

export async function getServerSideProps({ req }) {
  const host = req.headers.host || '';
  const isDentist = host.includes('findmydentist');
  return { props: { isDentist } };
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    badge: null,
    icon: Shield,
    desc: 'Pour démarrer et être visible.',
    features: [
      { ok: true,  text: 'Fiche profil basique' },
      { ok: true,  text: 'Page publique indexée Google' },
      { ok: true,  text: 'Lien téléphone / clinique' },
      { ok: false, text: 'Photo de profil' },
      { ok: false, text: 'Bio multilingue' },
      { ok: false, text: 'Prise de RDV en ligne' },
      { ok: false, text: 'WhatsApp direct' },
      { ok: false, text: 'Statistiques' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 200,
    badge: 'Le plus populaire',
    icon: Award,
    desc: 'Pour les médecins qui veulent du volume.',
    highlight: true,
    features: [
      { ok: true, text: 'Tout du plan Free' },
      { ok: true, text: 'Photo HD + Bio FR/EN/AR' },
      { ok: true, text: 'WhatsApp direct' },
      { ok: true, text: 'Prise de RDV en ligne' },
      { ok: true, text: 'Lien Google Maps' },
      { ok: true, text: 'Avis patients' },
      { ok: true, text: 'Statistiques 30 jours' },
      { ok: true, text: 'Boost SEO' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    badge: 'Pour les cliniques',
    icon: Building2,
    desc: 'Pour les cliniques et multi-praticiens.',
    features: [
      { ok: true, text: 'Tout du plan Premium' },
      { ok: true, text: 'Multi-praticiens (jusqu\'à 10)' },
      { ok: true, text: 'Page clinique custom' },
      { ok: true, text: 'Vérification DHA Sheryan live' },
      { ok: true, text: 'Statistiques 90 jours' },
      { ok: true, text: 'Export CSV patients' },
      { ok: true, text: 'Sync calendrier Google/Apple' },
      { ok: true, text: 'Account manager dédié' },
    ],
  },
];

export default function Pricing({ isDentist }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/20 to-white">
      <Head>
        <title>Tarifs — FindMyDoctor.ae</title>
        <meta name="description" content="Plans Free, Premium (200 AED/mois) et Pro (500 AED/mois) pour les médecins de Dubai. Annuaire gratuit pour les patients." />
      </Head>
      <SiteHeader />

      <section className="container-narrow py-16 md:py-20 text-center">
        <Badge variant="info" className="mb-4">Tarifs</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          Simple, transparent, sans engagement
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Annuaire <strong>100% gratuit pour les patients</strong>. Vous payez uniquement pour booster votre visibilité et débloquer les RDV en ligne.
        </p>
      </section>

      <section className="container-wide pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.id} className={`relative ${p.highlight ? 'ring-2 ring-primary shadow-2xl md:-mt-4' : ''}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="premium">{p.badge}</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">
                      {p.price === 0 ? 'Gratuit' : `${p.price} AED`}
                    </span>
                    {p.price > 0 && <span className="text-sm text-muted-foreground"> / mois</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.ok ? <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                        <span className={f.ok ? 'text-foreground' : 'text-muted-foreground line-through'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={p.id === 'free' ? '/dashboard/login' : `/dashboard/upgrade?plan=${p.id}`}>
                    <Button variant={p.highlight ? 'default' : 'outline'} className="w-full" size="lg">
                      {p.id === 'free' ? 'Commencer gratuitement' : 'Choisir ce plan'} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container-narrow pb-16 text-center">
        <Card className="p-8 bg-gradient-to-br from-primary to-cyan-500 border-0 text-white">
          <h2 className="text-2xl font-extrabold mb-2">Une question sur les tarifs ?</h2>
          <p className="text-white/85 mb-4">Notre équipe répond sous 24h.</p>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Nous contacter
            </Button>
          </Link>
        </Card>
      </section>
          <Footer />
</div>
  );
}
