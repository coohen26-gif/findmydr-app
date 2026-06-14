import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, MapPin, Calendar, ShieldCheck, Activity, Sparkles, Award, Clock, ChevronRight, Star, ArrowRight, Heart, Wrench, Smile, Baby, Zap, Hammer, Scissors } from 'lucide-react';
import { SiteHeader, Logo } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { FeaturedBadge } from "../../components/FeaturedBadge";
import { Input } from '../../components/Input';
import { slugify } from '../../lib/utils';

const STATS = [
  { value: '5 049', label: 'Dentistes DHA-licensés', icon: Activity, color: 'text-cyan-600' },
  { value: '15 673', label: 'Médecins', icon: Heart, color: 'text-rose-600' },
  { value: '3 120', label: 'Cliniques dentaires', icon: MapPin, color: 'text-emerald-600' },
  { value: '24/7', label: 'Urgences dentaires', icon: Zap, color: 'text-amber-600' },
];

const SPECIALTIES = [
  { icon: Activity, name: 'Dentiste généraliste', count: '2 134', slug: 'general', color: 'from-cyan-500 to-blue-500' },
  { icon: Sparkles, name: 'Esthétique dentaire', count: '684', slug: 'esthetique', color: 'from-pink-500 to-rose-500' },
  { icon: Wrench, name: 'Orthodontiste', count: '342', slug: 'orthodontiste', color: 'from-purple-500 to-indigo-500' },
  { icon: Hammer, name: 'Implantologie', count: '298', slug: 'implantologie', color: 'from-amber-500 to-orange-500' },
  { icon: Baby, name: 'Pédodontiste', count: '186', slug: 'pedodontiste', color: 'from-pink-400 to-rose-400' },
  { icon: Zap, name: 'Endodontiste', count: '142', slug: 'endodontiste', color: 'from-yellow-500 to-amber-500' },
  { icon: Scissors, name: 'Chirurgien-dentiste', count: '524', slug: 'chirurgien', color: 'from-red-500 to-rose-500' },
  { icon: Award, name: 'Parodontiste', count: '98', slug: 'parodontiste', color: 'from-teal-500 to-cyan-500' },
  { icon: Smile, name: 'Voir toutes', count: '641+', slug: 'all', color: 'from-gray-500 to-slate-500' },
];

const TRUST = [
  { icon: ShieldCheck, title: '100% vérifié DHA', desc: 'Tous les profils sont issus du registre officiel Dubai Health Authority (Sheryan).' },
  { icon: Clock, title: 'Urgences 24/7', desc: 'Trouvez un dentiste disponible en urgence, jour et nuit.' },
  { icon: Star, title: 'Avis patients vérifiés', desc: 'Tous les avis sont vérifiés après consultation réelle.' },
];

export default function DentistHome() {
  const initialQ = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '';
  const [search, setSearch] = React.useState(initialQ);
  const [dentists, setDentists] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/dentists?q=' + search)
      .then(r => r.json())
      .then(data => {
        setDentists(data.dentists || []);
        setLoading(false);
      });
  }, [search]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>FindMyDentist.ae — 5 049 dentistes DHA-licensés à Dubai</title>
        <meta name="description" content="Trouvez rapidement un dentiste à Dubai. Annuaire trilingue vérifié DHA. Esthétique, orthodontie, implants." />
      </Head>

      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-emerald-50">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20" />
          <div className="absolute -top-20 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="container-wide relative py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="success" className="text-sm px-3 py-1">
                🇦🇪 Made in UAE · 100% vérifié DHA
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                Votre sourire,<br />
                <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">
                  le bon dentiste.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-xl">
                Blanchiment, implants, orthodontie, urgences. L'annuaire de référence pour trouver un dentiste à Dubai.
              </p>
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Dentiste, spécialité, clinique…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 h-14 text-base shadow-lg border-0"
                />
                <Button size="lg" className="absolute right-1.5 top-1.5 h-11 bg-cyan-600 hover:bg-cyan-700">
                  Rechercher
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>Populaire :</span>
                {['Esthétique', 'Implants', 'Orthodontie', 'Urgence'].map(s => (
                  <Link key={s} href={`/dentist?q=${encodeURIComponent(s)}`} className="hover:text-cyan-600 underline-offset-4 hover:underline">
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-3xl rotate-6 opacity-10" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-br from-cyan-50 to-emerald-50 p-8 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 mb-6 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                      DR
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Dr. Fatima Al-Mansouri</h3>
                    <p className="text-muted-foreground mb-4">Orthodontiste · DHA Vérifié</p>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">4.8 (98 avis)</span>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Prendre rendez-vous</Button>
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
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="container-wide py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">Soins dentaires</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez le bon spécialiste pour chaque besoin dentaire.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SPECIALTIES.map(s => {
            const Icon = s.icon;
            return (
              <Link
                key={s.name}
                href={`/dentist?q=${encodeURIComponent(s.slug)}`}
                className="group relative bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.count} praticiens</p>
                <ChevronRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED DENTISTS */}
      <section className="bg-muted/30 py-20">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">Dentistes vedettes</h2>
              <p className="text-muted-foreground">
                {loading ? '⏳ Chargement...' : `${dentists.length} résultats affichés`}
              </p>
            </div>
            <Link href="/dentist" className="hidden sm:flex items-center gap-1 text-cyan-600 font-semibold hover:underline">
              Voir tous <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {dentists.length === 0 && !loading ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">Aucun résultat. Essayez une autre recherche.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dentists.slice(0, 12).map(p => {
                const slug = slugify(p.name) + '-' + p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/dentist/${slug}`}
                    className="group bg-white rounded-xl border border-border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar name={p.name} size="lg" verified />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-sm leading-tight line-clamp-1">{p.name}</h3>
                          {p.search_rank > 0 && <FeaturedBadge size="sm" />}
                        </div>
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
                      <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold pt-1">
                        Voir le profil
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

      {/* TRUST */}
      <section className="bg-gradient-to-br from-cyan-600 to-emerald-600 py-20 text-white">
        <div className="container-wide">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
            Pourquoi FindMyDentist.ae ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TRUST.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA PRO */}
      <section className="container-wide py-20">
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10" />
          <div className="relative p-8 md:p-12 text-center max-w-2xl mx-auto">
            <Badge variant="premium" className="mb-4">⭐ Pour les dentistes</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Activez votre profil premium
            </h2>
            <p className="text-white/80 mb-8">
              Recevez des patients qui cherchent votre spécialité. Bio trilingue, photos, horaires, prise de RDV intégrée.
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-8">
              <span className="text-5xl font-extrabold text-amber-400">200 AED</span>
              <span className="text-white/60">/ mois</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/dashboard/login">
                <Button variant="premium" size="lg">
                  Activer mon profil
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:contact@findmydentist.ae">
                <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                  Nous contacter
                </Button>
              </a>
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
                L'annuaire dentaire #1 à Dubai. Données officielles DHA (Sheryan).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Patients</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://findmydr.ae" className="hover:text-cyan-600">Trouver un médecin</a></li>
                <li><Link href="/dentist" className="hover:text-cyan-600">Trouver un dentiste</Link></li>
                <li><Link href="/dentist" className="hover:text-cyan-600">Spécialités dentaires</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Praticiens</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard/login" className="hover:text-cyan-600">Activer mon profil</Link></li>
                <li><Link href="/dashboard/login" className="hover:text-cyan-600">Connexion dentiste</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-cyan-600">Mentions légales</a></li>
                <li><a href="#" className="hover:text-cyan-600">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">© 2026 FindMyDentist.ae · Made with ❤️ in UAE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
