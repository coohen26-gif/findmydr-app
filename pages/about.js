/**
 * pages/about.js
 * About page. Renders on both findmydr.ae and findmydentist.ae (middleware handles domain detection).
 */
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stethoscope, Shield, Globe, Heart, Users, TrendingUp, Award, MapPin, Mail, Sparkles, Target } from 'lucide-react';
import { SiteHeader } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';

export async function getServerSideProps({ req, locale }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  const host = req.headers.host || '';
  const isDentist = host.includes('findmydentist');
  return { props: { isDentist, baseUrl: isDentist ? 'https://findmydentist.ae' : 'https://findmydr.ae', ...(await serverSideTranslations(locale, ['common'])) } };
}

const VALUES = (brand) => [
  { icon: Shield,  title: 'Vérification DHA',     desc: 'Chaque praticien est vérifié via le registre officiel Sheryan de la Dubai Health Authority.' },
  { icon: Globe,   title: '6 langues',            desc: 'Une plateforme accessible aux 200+ nationalités qui vivent à Dubai (FR/EN/AR/ZH/RU/FA).' },
  { icon: Heart,   title: 'Patients d\'abord',     desc: '100% gratuit pour les patients. Annuaire ouvert, sans paywall ni inscription obligatoire.' },
  { icon: Sparkles, title: 'SEO local #1',         desc: `Notre annuaire remonte en tête de Google pour "Dr [NOM] Dubai" — visibilité maximale pour les praticiens.` },
];

const NUMBERS = [
  { value: '20 722', label: 'Praticiens DHA',           icon: Users },
  { value: '5 241',  label: 'Établissements',           icon: MapPin },
  { value: '6',      label: 'Langues (FR/EN/AR/ZH/RU/FA)', icon: Globe },
  { value: '24/7',   label: 'Disponibilité de l\'annuaire', icon: TrendingUp },
];

const TEAM = [
  { name: 'M.',              role: 'Fondateur & CEO',       bio: 'Entrepreneur tech basé à Dubai. 10+ ans en digital.' },
  { name: 'Équipe produit',  role: 'Développement',         bio: 'Next.js, PostgreSQL, IA — tout en interne.' },
  { name: 'Équipe terrain',  role: 'Partenariats cliniques', bio: 'DHA, Mediclinic, Aster, NMC, Emirates Healthcare.' },
];

export default function About({ isDentist, baseUrl }) {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const localePrefix = `/${i18n.language || 'en'}`;
  const title = t('meta.about_title');
  const headline = t('hero.title');
  const brand = isDentist ? 'FindMyDentist' : 'FindMyDoctor';
  const values = VALUES(brand);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={t('meta.about_description')} />
        <link rel="alternate" hrefLang="fr" href={`${baseUrl}/fr${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="ar" href={`${baseUrl}/ar${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="zh" href={`${baseUrl}/zh${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="ru" href={`${baseUrl}/ru${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="fa" href={`${baseUrl}/fa${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${router.asPath.replace(/^\/(fr|en|ar|zh|ru|fa)(?=\/|$)/, '')}`} />
      </Head>
      <SiteHeader isDentist={isDentist} />

      <section className="gradient-hero text-white py-20 md:py-28">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{headline}</h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
            20 722 praticiens vérifiés. 5 241 établissements. Une seule plateforme en 6 langues, gratuite pour les patients.
          </p>
        </div>
      </section>

      <section className="container-wide py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-6 text-center">Notre mission</h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Dubai accueille 3,6 millions d'habitants représentant plus de 200 nationalités. Trouver un médecin de confiance,
            parlant sa langue et acceptant son assurance, relève du parcours du combattant. <strong className="text-foreground">{brand}.ae</strong> résout ce problème
            en référençant 100% des praticiens DHA-licensés de l'émirat, dans toutes les spécialités, avec une fiche vérifiée, multilingue et accessible en un clic.
          </p>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container-wide">
          <h2 className="text-3xl font-extrabold mb-10 text-center">Nos valeurs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Card key={i} className="text-center p-6">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-wide py-16">
        <h2 className="text-3xl font-extrabold mb-10 text-center">L'annuaire en chiffres</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {NUMBERS.map((n, i) => {
            const Icon = n.icon;
            return (
              <Card key={i} className="p-6 text-center">
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">{n.value}</div>
                <div className="text-sm text-muted-foreground">{n.label}</div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container-narrow">
          <h2 className="text-3xl font-extrabold mb-10 text-center">L'équipe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((m, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-cyan-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {m.name[0]}
                </div>
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-sm text-primary mb-2">{m.role}</p>
                <p className="text-sm text-muted-foreground">{m.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide py-16 text-center">
        <h2 className="text-3xl font-extrabold mb-4">Prêt à rejoindre l'annuaire ?</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Créez votre profil gratuitement en 2 minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard/login"><Button size="lg">Activer mon profil</Button></Link>
          <Link href="/contact"><Button size="lg" variant="outline">Nous contacter</Button></Link>
        </div>
      </section>
          <Footer />
</div>
  );
}
