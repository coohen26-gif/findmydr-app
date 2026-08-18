import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MapPin, Calendar, ShieldCheck, Stethoscope, Sparkles, Award, Clock, ChevronRight, Star, ArrowRight, Heart, Activity, Brain, Baby, Eye, Bone, Users, Pill } from 'lucide-react';
import { SiteHeader, Logo, SearchBar } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { FeaturedBadge } from "../../components/FeaturedBadge";
import { Input } from '../../components/Input';
import { slugify } from '../../lib/utils';

const STATS_KEYS = [
  { key: 'doctors', value: '15 673', icon: Stethoscope, color: 'text-primary' },
  { key: 'dentists', value: '5 049', icon: Activity, color: 'text-cyan-600' },
  { key: 'facilities', value: '5 241', icon: MapPin, color: 'text-emerald-600' },
  { key: 'booking', value: '24/7', icon: Calendar, color: 'text-amber-600' },
];

const SPECIALTIES = [
  { icon: Stethoscope, nameKey: 'home.categories.gp', name: 'Médecin généraliste', count: '4 556', slug: 'General', color: 'from-blue-500 to-cyan-500' },
  { icon: Heart, nameKey: 'home.categories.cardio', name: 'Cardiologue', count: '483', slug: 'Cardiology', color: 'from-rose-500 to-pink-500' },
  { icon: Brain, nameKey: 'home.categories.neuro', name: 'Neurologue', count: '212', slug: 'Neurology', color: 'from-purple-500 to-indigo-500' },
  { icon: Baby, nameKey: 'home.categories.pediatre', name: 'Pédiatre', count: '604', slug: 'Pediatrics', color: 'from-pink-500 to-rose-400' },
  { icon: Eye, nameKey: 'home.categories.ophtalmo', name: 'Ophtalmologue', count: '389', slug: 'Ophthalmology', color: 'from-cyan-500 to-blue-500' },
  { icon: Bone, nameKey: 'home.categories.ortho', name: 'Orthopédiste', count: '376', slug: 'Orthopedic', color: 'from-amber-500 to-orange-500' },
  { icon: Users, nameKey: 'home.categories.gyneco', name: 'Gynécologue', count: '742', slug: 'Obstetrics', color: 'from-fuchsia-500 to-purple-500' },
  { icon: Sparkles, nameKey: 'home.categories.dermato', name: 'Dermatologue', count: '624', slug: 'Dermatology', color: 'from-emerald-500 to-teal-500' },
  { icon: Pill, nameKey: 'home.categories.orl', name: 'ORL', count: '298', slug: 'Otolaryngology', color: 'from-orange-500 to-red-500' },
  { icon: Activity, nameKey: 'home.categories.endocrino', name: 'Endocrinologue', count: '186', slug: 'Endocrinology', color: 'from-indigo-500 to-blue-500' },
  { icon: Award, nameKey: 'home.categories.anesthesiste', name: 'Anesthésiste', count: '479', slug: 'Anesthesia', color: 'from-slate-500 to-gray-500' },
  { icon: Stethoscope, nameKey: 'home.categories.all', name: 'Voir toutes', count: '5 521+', slug: '', color: 'from-gray-500 to-slate-500' },
];

const TRUST_KEYS = [
  { icon: ShieldCheck, titleKey: 'doctor.listing.trust.verified_title', title: '100% vérifié DHA', descKey: 'doctor.listing.trust.verified_desc', desc: 'Tous les profils sont issus du registre officiel Dubai Health Authority (Sheryan).' },
  { icon: Clock, titleKey: 'doctor.listing.trust.response_title', title: 'Réponse en 24h', descKey: 'doctor.listing.trust.response_desc', desc: 'Les médecins premium répondent à vos demandes de rendez-vous en moins de 24h.' },
  { icon: Star, titleKey: 'doctor.listing.trust.reviews_title', title: 'Avis patients vérifiés', descKey: 'doctor.listing.trust.reviews_desc', desc: 'Tous les avis sont vérifiés après consultation réelle.' },
];

const FEATURED_FACILITIES = [
  { name: 'American Hospital Dubai', pros: 701, location: 'Oud Metha', image: '🏥' },
  { name: 'Mediclinic City Hospital', pros: 614, location: 'Dubai Healthcare City', image: '🏨' },
  { name: 'Rashid Hospital', pros: 1713, location: 'Bur Dubai', image: '🏥' },
  { name: 'Latifa Hospital', pros: 574, location: 'Al Jaddaf', image: '🏥' },
  { name: 'Kings College Hospital', pros: 544, location: 'Dubai Hills', image: '🏨' },
  { name: 'Al Jalila Children Hospital', pros: 685, location: 'Al Jaddaf', image: '👶' },
];

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const localePrefix = `/${i18n.language || 'en'}`;
  const initialQ = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '';
  const [search, setSearch] = React.useState(initialQ);
  const [physicians, setPhysicians] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/physicians?q=' + encodeURIComponent(search))
      .then(r => r.json())
      .then(data => {
        setPhysicians(data.physicians || []);
        setLoading(false);
      });
  }, [search]);

  const handleSearch = (q) => {
    setSearch(q);
    // Update URL without reload
    const url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
    // Scroll to results
    const el = document.getElementById('search-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{t('meta.doctors_title')}</title>
        <meta name="description" content={t('meta.doctors_description')} />
        <link rel="alternate" hrefLang="fr" href={`https://findmydr.ae/fr${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="en" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="ar" href={`https://findmydr.ae/ar${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
      </Head>

      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-cyan-50">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20" />
          <div className="absolute -top-20 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="container-wide relative py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="info" className="text-sm px-3 py-1">
                🇦🇪 {t('home.verified_dha', 'Made in UAE · 100% vérifié DHA')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-xl">
                {t('hero.subtitle')}
              </p>
              <SearchBar placeholder={t('nav.search_placeholder')} size="lg" onSearch={handleSearch} />
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{t('doctor.listing.popular_label', 'Populaire :')}</span>
                {['Cardiology', 'Pediatrics', 'Obstetrics', 'Dermatology'].map(s => (
                  <Link key={s} href={`${localePrefix}/doctor?q=${encodeURIComponent(s)}`} className="hover:text-primary underline-offset-4 hover:underline">
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-cyan-500 rounded-3xl rotate-6 opacity-10" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-br from-primary-50 to-cyan-50 p-8 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-cyan-500 mb-6 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                      DR
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Dr. Sara Al-Mansouri</h3>
                    <p className="text-muted-foreground mb-4">{t('home.categories.dermato', 'Dermatologue')} · {t('doctor.listing.hero_card.verified_suffix', 'DHA Vérifié')}</p>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">4.9 (127 {t('doctor.reviews', 'avis')})</span>
                    </div>
                    <Button className="w-full">{t('doctor.book', 'Prendre rendez-vous')}</Button>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fade-in">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('doctor.listing.hero_card.tomorrow_slot', 'Demain 14h30')}</div>
                    <div className="text-sm font-semibold">{t('doctor.listing.hero_card.available', 'Disponible')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {STATS_KEYS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{t(`doctor.listing.stats.${s.key}`)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-wide py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">{t('doctor.listing.categories_title', 'Explorez par spécialité')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('doctor.listing.categories_subtitle', 'Plus de 15 000 praticiens DHA-licensés dans toutes les spécialités médicales.')}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SPECIALTIES.map(s => {
            const Icon = s.icon;
            return (
              <Link
                key={s.name}
                href={s.slug ? `/doctor?q=${encodeURIComponent(s.slug)}` : '/doctor'}
                className="group relative bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary-500/30 transition-all duration-200"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{t(s.nameKey, s.name)}</h3>
                <p className="text-xs text-muted-foreground">{s.count} {t('doctor.listing.practitioners_suffix', 'praticiens')}</p>
                <ChevronRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="search-results" className="bg-muted/30 py-20">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">{t('home.featured.title')}</h2>
              <p className="text-muted-foreground">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <>{t('search.results_count', { count: physicians.length })}{search ? ` ${t('search.results_for', 'pour "{query}"').replace('{query}', search)}` : ''}</>
                )}
              </p>
            </div>
          </div>
          {physicians.length === 0 && !loading ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">{t('doctor.listing.no_results', 'Aucun résultat. Essayez une autre recherche.')}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {physicians.slice(0, 12).map(p => (
                <Link
                  key={p.id}
                  href={`/doctor?id=${p.id}`}
                  className="group bg-white rounded-xl border border-border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar name={p.name} size="lg" verified />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.specialty || '—'}</p>
                      <Badge variant="verified" className="mt-2 text-[10px] py-0">
                        <ShieldCheck className="h-3 w-3" /> DHA
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{p.facility_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold pt-1">
                      {t('doctor.listing.view_profile', 'Voir le profil')}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container-wide py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">{t('doctor.listing.facilities_title', 'Établissements de référence')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('doctor.listing.facilities_subtitle', 'Les hôpitaux et cliniques les mieux notés de Dubai.')}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FEATURED_FACILITIES.map(f => (
            <div
              key={f.name}
              className="bg-white border border-border rounded-xl p-4 text-center hover:shadow-md hover:border-primary-500/30 transition-all cursor-pointer"
            >
              <div className="text-4xl mb-2">{f.image}</div>
              <h3 className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{f.name}</h3>
              <p className="text-[10px] text-muted-foreground">{f.location}</p>
              <p className="text-xs font-bold text-primary mt-1">{f.pros} {t('doctor.listing.pros_suffix', 'pros')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary to-cyan-600 py-20 text-white">
        <div className="container-wide">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
            {t('doctor.listing.why_title', 'Pourquoi FindMyDoctor.ae ?')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TRUST_KEYS.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.titleKey} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t(item.titleKey, item.title)}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{t(item.descKey, item.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-wide py-20">
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10" />
          <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="premium" className="mb-4">⭐ {t('doctor.listing.cta.badge', 'Pour les praticiens')}</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                {t('doctor.listing.cta.title', 'Activez votre profil premium')}
              </h2>
              <p className="text-white/80 mb-6 text-pretty">
                {t('doctor.listing.cta.desc', 'Recevez des patients qui cherchent votre spécialité. Bio trilingue, photos, horaires, prise de RDV intégrée.')}
              </p>
              <ul className="space-y-2 mb-8 text-sm">
                <li className="flex items-center gap-2">✅ {t('doctor.listing.cta.benefit_1', 'Fiche premium avec photos et vidéos')}</li>
                <li className="flex items-center gap-2">✅ {t('doctor.listing.cta.benefit_2', 'Réservation en ligne intégrée')}</li>
                <li className="flex items-center gap-2">✅ {t('doctor.listing.cta.benefit_3', 'Messagerie patient sécurisée')}</li>
                <li className="flex items-center gap-2">✅ {t('doctor.listing.cta.benefit_4', 'Statistiques de vues et clics')}</li>
              </ul>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-amber-400">200 AED</span>
                <span className="text-white/60">{t('doctor.listing.cta.price_period', '/ mois')}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/login">
                  <Button variant="premium" size="lg">
                    {t('home.premium_cta.cta', 'Activer mon profil')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:contact@findmydr.ae">
                  <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                    {t('doctor.listing.cta.contact', 'Nous contacter')}
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="text-7xl mb-2">⭐</div>
                    <div className="text-2xl font-bold">200 AED</div>
                    <div className="text-sm opacity-90">{t('doctor.listing.cta.price_period', '/ mois')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border bg-muted/30">
        <div className="container-wide py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo size="lg" />
              <p className="text-sm text-muted-foreground mt-4 text-pretty">
                {t('footer.tagline', "L'annuaire médical #1 à Dubai. Données officielles Dubai Health Authority (Sheryan).")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer.col_patients', 'Patients')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary">{t('footer.link_find_doctor', 'Trouver un médecin')}</Link></li>
                <li><a href="https://findmydentist.ae" className="hover:text-primary">{t('footer.link_find_dentist', 'Trouver un dentiste')}</a></li>
                <li><Link href="/" className="hover:text-primary">{t('doctor.listing.footer.specialties_link', 'Spécialités')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer.col_pros', 'Praticiens')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard/login" className="hover:text-primary">{t('footer.link_activate_profile', 'Activer mon profil')}</Link></li>
                <li><Link href="/dashboard/login" className="hover:text-primary">{t('footer.link_doctor_login', 'Connexion médecin')}</Link></li>
                <li><a href="mailto:contact@findmydr.ae" className="hover:text-primary">{t('nav.contact', 'Contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer.col_legal', 'Légal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">{t('footer.link_legal_notice', 'Mentions légales')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('footer.link_privacy', 'Politique de confidentialité')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('footer.link_cgu', 'CGU')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">{t('footer.copyright', '© 2026 FindMyDoctor.ae · Tous droits réservés')}</p>
            <p className="text-xs text-muted-foreground">{t('footer.made_in_uae', 'Made with ❤️ in UAE')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  const safeLocale = (locale && ['fr','en','ar','zh','ru','fa'].includes(locale)) ? locale : 'en';
  return {
    props: {
      ...(await serverSideTranslations(safeLocale, ['common'])),
    },
  };
}
