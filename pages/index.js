import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Search, MapPin, Calendar, ShieldCheck, Stethoscope, Sparkles, Award, Clock, ChevronRight, Star, ArrowRight, Heart, Activity, Brain, Baby, Eye, Bone, Users, Pill, Globe } from 'lucide-react';
import { SiteHeader, Logo } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { slugify } from '../lib/utils';

const STATS = [
  { value: '15 673', key: 'doctors', icon: Stethoscope, color: 'text-primary' },
  { value: '5 049', key: 'dentists', icon: Activity, color: 'text-cyan-600' },
  { value: '5 241', key: 'facilities', icon: MapPin, color: 'text-emerald-600' },
  { value: '24/7', key: 'languages', icon: Calendar, color: 'text-amber-600' },
];

const SPECIALTIES = [
  { icon: Stethoscope, key: 'gp', count: '4 556', slug: 'general', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { icon: Heart, key: 'cardio', count: '483', slug: 'cardio', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
  { icon: Brain, key: 'neuro', count: '212', slug: 'neuro', color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50' },
  { icon: Baby, key: 'pediatre', count: '604', slug: 'pediatre', color: 'from-pink-500 to-rose-400', bg: 'bg-pink-50' },
  { icon: Eye, key: 'ophtalmo', count: '389', slug: 'ophtalmo', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
  { icon: Bone, key: 'ortho', count: '376', slug: 'ortho', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { icon: Users, key: 'gyneco', count: '742', slug: 'gyneco', color: 'from-fuchsia-500 to-purple-500', bg: 'bg-fuchsia-50' },
  { icon: Sparkles, key: 'dermato', count: '624', slug: 'dermato', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
  { icon: Pill, key: 'orl', count: '298', slug: 'orl', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  { icon: Activity, key: 'endocrino', count: '186', slug: 'endocrino', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
  { icon: Award, key: 'anesthesiste', count: '479', slug: 'anesthesiste', color: 'from-slate-500 to-gray-500', bg: 'bg-slate-50' },
  { icon: Stethoscope, key: 'all', count: '5 521+', slug: 'all', color: 'from-gray-500 to-slate-500', bg: 'bg-gray-50' },
];

const TRUST = [
  { icon: ShieldCheck, key: 'dha' },
  { icon: Globe, key: 'trilingual' },
  { icon: Star, key: 'fees' },
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
  const [search, setSearch] = React.useState('');
  const [physicians, setPhysicians] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const localePrefix = `/${i18n.language || 'en'}`;

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch('/api/physicians?q=' + encodeURIComponent(search), { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          setPhysicians(data.physicians || []);
          setLoading(false);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setLoading(false);
          }
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{t('meta.home_title')}</title>
        <meta name="description" content={t('meta.home_description')} />
        <meta name="keywords" content={t('meta.home_keywords')} />
        <link rel="alternate" hrefLang="fr" href={`https://findmydr.ae/fr${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="en" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="ar" href={`https://findmydr.ae/ar${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
      </Head>

      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-cyan-50">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20" />
          <div className="absolute -top-20 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="container-wide relative py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="info" className="text-sm px-3 py-1">
                🇦🇪 {t('home.verified_dha')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-xl">
                {t('hero.subtitle')}
              </p>
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t('nav.search_placeholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 h-14 text-base shadow-lg border-0"
                />
                <Button size="lg" className="absolute right-1.5 top-1.5 h-11">
                  {t('nav.search_button')}
                </Button>
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
                    <p className="text-muted-foreground mb-4">{t('home.categories.dermato')} · {t('doctor.verified_dha')}</p>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{t('doctor.rating_keys.no_reviews')}</span>
                    </div>
                    <Button className="w-full">{t('doctor.book')}</Button>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fade-in">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Demain 14h30</div>
                    <div className="text-sm font-semibold">Disponible</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="container-wide -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{t(`home.stats.${s.key}`)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="container-wide py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">{t('home.categories_title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.categories_subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SPECIALTIES.map(s => {
            const Icon = s.icon;
            const name = s.key === 'all' ? t('common.see_more') : (t(`home.categories.${s.key}`, { defaultValue: s.key }));
            return (
              <Link
                key={s.slug}
                href={`${localePrefix}/doctor?q=${encodeURIComponent(s.slug)}`}
                className="group relative bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary-500/30 transition-all duration-200"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{name}</h3>
                <p className="text-xs text-muted-foreground">{s.count} {t('common.from', { defaultValue: 'praticiens' })}</p>
                <ChevronRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED DOCTORS */}
      <section className="bg-muted/30 py-20">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">{t('home.featured.title')}</h2>
              <p className="text-muted-foreground">
                {loading ? t('common.loading') : t('search.results_count', { count: physicians.length })}
              </p>
            </div>
            <Link href={`${localePrefix}/doctor`} className="hidden sm:flex items-center gap-1 text-primary font-semibold hover:underline">
              {t('common.see_more')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {physicians.length === 0 && !loading ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">{t('search.no_results')}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {physicians.slice(0, 12).map(p => {
                const slug = slugify(p.name) + '-' + p.id;
                return (
                  <Link
                    key={p.id}
                    href={`${localePrefix}/doctor/${slug}`}
                    className="group bg-white rounded-xl border border-border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar name={p.name} size="lg" verified={p.is_dha_verified === true} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight line-clamp-1">{p.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.specialty || '—'}</p>
                        {p.is_dha_verified === true && (
                          <Badge variant="verified" className="mt-2 text-[10px] py-0">
                            <ShieldCheck className="h-3 w-3" /> DHA
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{p.facility_name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-semibold pt-1">
                        {t('common.see_more')}
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* TOP FACILITIES */}
      <section className="container-wide py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FEATURED_FACILITIES.map(f => (
            <div
              key={f.name}
              className="bg-white border border-border rounded-xl p-4 text-center hover:shadow-md hover:border-primary-500/30 transition-all cursor-pointer"
            >
              <div className="text-4xl mb-2">{f.image}</div>
              <h3 className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{f.name}</h3>
              <p className="text-[10px] text-muted-foreground">{f.location}</p>
              <p className="text-xs font-bold text-primary mt-1">{f.pros} pros</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-gradient-to-br from-primary to-cyan-600 py-20 text-white">
        <div className="container-wide">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
            {t('pricing.compare_title', { defaultValue: 'Pourquoi FindMyDoctor.ae ?' })}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% DHA {t('common.verified')}</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('home.stats.doctors')} — Dubai Health Authority (Sheryan).
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">FR / EN / AR</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('common.from', { defaultValue: 'Cherchez et réservez dans votre langue.' })}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('common.verified')} Pricing</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('pricing.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA PRO */}
      <section className="container-wide py-20">
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10" />
          <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="premium" className="mb-4">⭐ {t('home.premium_cta.title')}</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                {t('home.premium_cta.title')}
              </h2>
              <p className="text-white/80 mb-6 text-pretty">
                {t('home.premium_cta.subtitle')}
              </p>
              <ul className="space-y-2 mb-8 text-sm">
                <li className="flex items-center gap-2">✅ {t('home.premium_cta.benefit_1')}</li>
                <li className="flex items-center gap-2">✅ {t('home.premium_cta.benefit_2')}</li>
                <li className="flex items-center gap-2">✅ {t('home.premium_cta.benefit_3')}</li>
              </ul>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-amber-400">{t('pricing.premium.price').replace(' AED', '')}</span>
                <span className="text-white/60">{t('common.aed')}/ {t('pricing.premium.period').replace('/ ', '')}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`${localePrefix}/dashboard/login`}>
                  <Button variant="premium" size="lg">
                    {t('home.premium_cta.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:contact@findmydr.ae">
                  <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                    {t('nav.contact')}
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="text-7xl mb-2">⭐</div>
                    <div className="text-2xl font-bold">{t('pricing.premium.price').replace(' AED', '')}</div>
                    <div className="text-sm opacity-90">{t('pricing.premium.period')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
      <Footer />
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
