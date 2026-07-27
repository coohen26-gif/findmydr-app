import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Eye, MessageCircle, TrendingUp, Settings, Calendar, Award, ChevronRight, Sparkles, ArrowRight, Activity, AlertCircle, Phone, Percent } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';

function SparklineChart({ data, color = '#0066FF', height = 40 }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => parseInt(d.count || 0, 10));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-fill-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.split(' ').pop().split(',')[0]} cy={points.split(' ').pop().split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

function TrendBadge({ values }) {
  if (!values || values.length < 2) return null;
  const nums = values.map(d => parseInt(d.count || 0, 10));
  const first = nums[0];
  const last = nums[nums.length - 1];
  if (first === 0) return <Badge variant="secondary" className="text-xs">—</Badge>;
  const pct = Math.round(((last - first) / first) * 100);
  if (pct > 0) return <Badge variant="success" className="text-xs">+{pct}%</Badge>;
  if (pct < 0) return <Badge variant="destructive" className="text-xs">{pct}%</Badge>;
  return <Badge variant="secondary" className="text-xs">0%</Badge>;
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [user, setUser] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/profile').then(r => r.json()),
      fetch('/api/dashboard/stats').then(r => r.json()),
    ])
      .then(([profileData, statsData]) => {
        if (profileData.user) {
          setUser(profileData.user);
          setStats(statsData);
        } else {
          router.push('/dashboard/login');
        }
        setLoading(false);
      })
      .catch(() => router.push('/dashboard/login'));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <SiteHeader />
        <div className="container-wide py-8 animate-pulse space-y-8">
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-48 rounded-2xl bg-muted" />
            <div className="h-48 rounded-2xl bg-muted" />
            <div className="h-48 rounded-2xl bg-muted" />
          </div>
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-36 rounded-2xl bg-muted" />
            <div className="h-36 rounded-2xl bg-muted" />
            <div className="h-36 rounded-2xl bg-muted" />
          </div>
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const completeness = user.profile_completeness || 0;
  const isComplete = completeness >= 80;
  const userName = user.full_name_en || user.email.split('@')[0];

  const viewsTotal = stats?.views?.total || 0;
  const whatsappClicks = stats?.clicks?.find?.(c => c.click_type === 'whatsapp')?.count || 0;
  const whatsappClicksNum = parseInt(whatsappClicks, 10) || 0;
  const totalClicks = stats?.clicks?.reduce?.((s, c) => s + parseInt(c.count || 0, 10), 0) || 0;
  const conversionRate = viewsTotal > 0 ? ((whatsappClicksNum / viewsTotal) * 100).toFixed(1) : '0.0';
  const viewsPerDay = stats?.views?.per_day || [];
  const apptsTotal = stats?.appointments?.total || 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <Head>
        <title>{t('nav.dashboard')} — FindMyDoctor.ae</title>
      </Head>

      <SiteHeader user={user} />

      <div className="container-wide py-8">
        {/* Welcome banner */}
        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-cyan-500 border-0 text-white">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <Avatar name={userName} size="2xl" className="ring-4 ring-white/30" />
            <div className="flex-1">
              <Badge variant="premium" className="mb-2 bg-white/20 text-white border-0">
                {user.plan === 'premium' ? '⭐ Premium' : 'Free'}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-1">
                Bonjour, Dr. {userName}
              </h1>
              <p className="text-white/80">
                {isComplete
                  ? "Votre profil est complet et visible sur l'annuaire."
                  : `Complétez votre profil (${completeness}%) pour être visible.`}
              </p>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                {isComplete ? 'Voir mon profil' : 'Compléter'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {!isComplete && (
          <Card className="mb-8 p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">Votre profil est incomplet</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Les profils avec photo, bio et langues parlées reçoivent <strong>5x plus de vues</strong>.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${completeness}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-amber-900">{completeness}%</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 🏆 Money-Shot: 3 big stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card className="p-6 overflow-hidden relative">
            <div className="flex items-start justify-between mb-1">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <TrendBadge values={viewsPerDay} />
            </div>
            <div className="text-3xl font-extrabold mb-1">{viewsTotal.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mb-3">Vues Totales</div>
            <div className="h-10">
              <SparklineChart data={viewsPerDay} color="#0066FF" />
            </div>
          </Card>
          <Card className="p-6 overflow-hidden relative">
            <div className="flex items-start justify-between mb-1">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <TrendBadge values={stats?.clicks?.filter?.(c => c.click_type === 'whatsapp')?.map?.(c => ({ count: c.count })) || []} />
            </div>
            <div className="text-3xl font-extrabold mb-1">{whatsappClicksNum.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mb-3">Clics WhatsApp</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>Appels directs: {totalClicks.toLocaleString()}</span>
            </div>
          </Card>
          <Card className="p-6 overflow-hidden relative">
            <div className="flex items-start justify-between mb-1">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Percent className="h-6 w-6 text-amber-600" />
              </div>
              <Badge variant={parseFloat(conversionRate) > 5 ? 'success' : parseFloat(conversionRate) > 2 ? 'warning' : 'secondary'} className="text-xs">
                {viewsTotal > 0 ? 'Actif' : 'En attente'}
              </Badge>
            </div>
            <div className="text-3xl font-extrabold mb-1">{conversionRate}%</div>
            <div className="text-sm text-muted-foreground mb-3">Taux de Conversion</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{apptsTotal} RDV ce mois</span>
            </div>
          </Card>
        </div>

        {/* Action cards */}
        <h2 className="text-xl font-extrabold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/profile">
            <Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">Mon profil</h3>
              <p className="text-sm text-muted-foreground mb-3">Photo, bio, spécialités, contact</p>
              <div className="flex items-center gap-1 text-sm text-primary font-semibold">
                Compléter <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/calendar">
            <Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="font-bold text-lg mb-1">Mes rendez-vous</h3>
              <p className="text-sm text-muted-foreground mb-3">Gérer votre agenda et disponibilités</p>
              <div className="flex items-center gap-1 text-sm text-cyan-600 font-semibold">
                Voir le calendrier <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/upgrade">
            <Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1">Passer Premium</h3>
              <p className="text-sm text-muted-foreground mb-3">Débloquez toutes les fonctionnalités</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-extrabold text-amber-600">200 AED</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-600 font-semibold">
                Upgrade <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent activity */}
        <h2 className="text-xl font-extrabold mb-4">Activité récente</h2>
        <Card className="p-6">
          {viewsPerDay.length > 0 || totalClicks > 0 ? (
            <div className="space-y-3">
              {viewsPerDay.slice(-7).reverse().map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground">{d.day?.slice(5) || '—'}</span>
                  <span className="font-semibold">{d.count} vue{d.count !== '1' ? 's' : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune activité pour le moment.</p>
              <p className="text-xs mt-1">Vos premières vues et clics apparaîtront ici.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale, req }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
