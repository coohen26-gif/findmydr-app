/**
 * pages/dashboard/upgrade.js
 * Pricing page with 3 plans (Free, Premium 200 AED/mo, Pro 500 AED/mo).
 * The "Upgrade" button POSTs to /api/stripe/create-checkout (stub for now).
 */
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Check, X, Sparkles, Award, Building2, ChevronLeft, Shield, Star, Zap, Loader2 } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { Badge } from '../../components/Badge';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'pour toujours',
    description: 'Pour démarrer et être visible.',
    cta: 'Plan actuel',
    icon: Shield,
    features: [
      { ok: true,  text: 'Fiche profil basique (nom, spécialité, clinique)' },
      { ok: true,  text: 'Page publique sur findmydr.ae' },
      { ok: true,  text: 'Lien vers clinique / téléphone' },
      { ok: true,  text: 'Indexation Google' },
      { ok: false, text: 'Photo de profil' },
      { ok: false, text: 'Bio multilingue' },
      { ok: false, text: 'Prise de RDV en ligne' },
      { ok: false, text: 'WhatsApp direct' },
      { ok: false, text: 'Statistiques de vues' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 200,
    period: 'par mois',
    description: 'Pour les médecins qui veulent du volume.',
    cta: 'Passer Premium',
    icon: Award,
    highlight: true,
    badge: 'Le plus populaire',
    features: [
      { ok: true, text: 'Tout du plan Free' },
      { ok: true, text: 'Photo de profil HD' },
      { ok: true, text: 'Bio complète (FR/EN/AR)' },
      { ok: true, text: 'Bouton WhatsApp direct' },
      { ok: true, text: 'Prise de RDV en ligne' },
      { ok: true, text: 'Lien Google Maps' },
      { ok: true, text: 'Avis patients (modérés)' },
      { ok: true, text: 'Statistiques de vues (30j)' },
      { ok: true, text: 'Boost SEO (top résultats)' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    period: 'par mois',
    description: 'Pour les cliniques et multi-praticiens.',
    cta: 'Passer Pro',
    icon: Building2,
    badge: 'Pour les cliniques',
    features: [
      { ok: true, text: 'Tout du plan Premium' },
      { ok: true, text: 'Multi-praticiens (jusqu\'à 10)' },
      { ok: true, text: 'Page clinique custom' },
      { ok: true, text: 'Vérification DHA Sheryan en temps réel' },
      { ok: true, text: 'Statistiques avancées (90j)' },
      { ok: true, text: 'Export CSV patients' },
      { ok: true, text: 'Intégration calendrier Google/Apple' },
      { ok: true, text: 'Support prioritaire 24/7' },
      { ok: true, text: 'Account manager dédié' },
    ],
  },
];

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans frais ni engagement. Votre plan reste actif jusqu\'à la fin de la période payée.' },
  { q: 'Comment fonctionne le paiement ?', a: 'Par carte bancaire (Visa, Mastercard) ou Apple Pay via Stripe. Facture envoyée par email.' },
  { q: 'Y a-t-il une période d\'essai ?', a: 'Le plan Free est gratuit à vie. Vous pouvez upgrader et downgrader quand vous voulez.' },
  { q: 'Combien de patients puis-je recevoir ?', a: 'Illimité sur tous les plans. Le plan Free a moins de visibilité SEO mais reste indexé.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Oui, conformes DIFC Data Law UAE + RGPD. Hébergées à Dubaï, sauvegardées quotidiennement.' },
];

export default function UpgradePage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [billingCycle, setBillingCycle] = React.useState('monthly');
  const [upgrading, setUpgrading] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/dashboard/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    if (!user) {
      router.push('/dashboard/login');
      return;
    }
    setUpgrading(planId);
    try {
      const r = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle: billingCycle }),
      });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        alert('Le système de paiement sera bientôt disponible. Contactez-nous sur contact@findmydr.ae.');
      }
    } catch {
      alert('Erreur de connexion. Réessayez plus tard.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
      <Head><title>{t('meta.pricing_title')}</title></Head>
      <SiteHeader user={user} />

      <div className="container-wide py-12 md:py-16">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
            <ChevronLeft className="h-4 w-4" /> Tableau de bord
          </Link>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="info" className="mb-4">Tarifs transparents</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              {t('dashboard.upgrade.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('pricing.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'monthly' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'yearly' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            Annuel <span className="text-xs">(-20%)</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const price = billingCycle === 'yearly' && p.price > 0 ? Math.round(p.price * 12 * 0.8) : p.price;
            const isCurrent = user?.plan === p.id;
            return (
              <Card
                key={p.id}
                className={`relative ${p.highlight ? 'ring-2 ring-primary shadow-2xl md:-mt-4' : ''}`}
              >
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
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">
                        {price === 0 ? 'Gratuit' : `${price} AED`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          / {billingCycle === 'yearly' ? 'an' : 'mois'}
                        </span>
                      )}
                    </div>
                    {price > 0 && billingCycle === 'yearly' && (
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        Économisez {Math.round(p.price * 12 * 0.2)} AED / an
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.ok ? (
                          <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={f.ok ? 'text-foreground' : 'text-muted-foreground line-through'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={p.highlight ? 'default' : 'outline'}
                    className="w-full"
                    size="lg"
                    disabled={isCurrent || upgrading === p.id}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    {upgrading === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      'Plan actuel'
                    ) : (
                      p.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-6">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <Card key={i} className="p-5">
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Besoin d'un plan entreprise sur mesure ?{' '}
            <a href="mailto:contact@findmydr.ae" className="text-primary font-semibold hover:underline">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
