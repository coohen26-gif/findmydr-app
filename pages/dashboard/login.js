import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Mail, Loader2, Stethoscope, ShieldCheck, Sparkles, ArrowRight, ChevronLeft, KeyRound, Globe } from 'lucide-react';
import { Logo } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { LOCALE_MAP } from '../_app';

const SUPPORTED_LANGS = Object.keys(LOCALE_MAP);
const LOCALE_REGEX = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`);

export async function getServerSideProps({ locale, req }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function Login() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [license, setLicense] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [linkRequested, setLinkRequested] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [language, setLanguage] = React.useState(router.locale || 'en');

  const handleLanguageChange = (e) => {
    const code = e.target.value;
    if (!LOCALE_MAP[code]) return;
    setLanguage(code);
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;SameSite=Lax`;
    }
    const stripped = (router.asPath || '/').replace(LOCALE_REGEX, '/') || '/';
    const nextPath = stripped === '/' ? `/${code}/` : `/${code}${stripped}`;
    router.push(nextPath);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dha_license: license || undefined }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Une erreur est survenue');
      } else {
        setLinkRequested(true);
      }
    } catch (err) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <Head>
        <title>{t("dashboard.login.title", "Connexion médecin")} — FindMyDoctor.ae</title>
      </Head>

      {/* LEFT — Visual hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="relative">
          <Logo size="lg" className="text-white [&_*]:text-white" />
          <p className="text-sm text-white/70 mt-2">Espace médecin</p>
        </div>
        <div className="relative space-y-8 max-w-md">
          <Badge variant="premium" className="bg-white/20 text-white border-0">
            <Sparkles className="h-3 w-3" /> Pour les praticiens DHA
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-balance">
            Activez votre profil en 60 secondes.
          </h1>
          <p className="text-lg text-white/80 text-pretty">
            Bio trilingue, photos, prise de RDV en ligne, statistiques de vues et de clics.
            Tout ce qu'il faut pour être visible à Dubai.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">100% sécurisé</div>
                <div className="text-xs text-white/70">Pas de mot de passe. Lien magique à usage unique.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Trilingue</div>
                <div className="text-xs text-white/70">Français, anglais, arabe. Vos patients vous trouvent.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">15 673 collègues déjà sur FindMyDoctor.ae</div>
                <div className="text-xs text-white/70">Rejoignez le plus grand annuaire médical de Dubai.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative text-xs text-white/60">
          © 2026 FindMyDoctor.ae · Données DHA Sheryan
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex flex-col p-6 md:p-12">
        <div className="flex items-center justify-between mb-8 lg:mb-0">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="text-sm bg-transparent border-0 focus:ring-0 cursor-pointer"
              aria-label={t("nav.change_language")}
            >
              {SUPPORTED_LANGS.map((code) => (
                <option key={code} value={code}>{LOCALE_MAP[code].short}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"><ChevronLeft className="h-4 w-4" /> {t("dashboard.login.back_site")}</Link>
              <h2 className="text-3xl font-extrabold mb-2">{t("dashboard.login.welcome")}</h2>
              <p className="text-muted-foreground">{t("dashboard.login.subtitle")}</p>
            </div>

            {linkRequested ? (
              <Card className="p-6 bg-emerald-50 border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{t("dashboard.login.link_sent")}</h3>
                    <p className="text-sm text-muted-foreground">{t("dashboard.login.link_help")}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">{t("dashboard.login.email_label")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("dashboard.login.email_placeholder")}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="license" className="block text-sm font-semibold mb-2">{t("dashboard.login.license_label")} <span className="text-muted-foreground font-normal">{t("dashboard.login.license_optional")}</span></label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="license"
                      type="text"
                      placeholder={t("dashboard.login.license_placeholder")}
                      value={license}
                      onChange={e => setLicense(e.target.value)}
                      className="pl-10"
                      maxLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t("dashboard.login.license_help")}</p>
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {error}
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("dashboard.login.submitting")}
                    </>
                  ) : (
                    <>
                      {t("dashboard.login.submit")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t("dashboard.login.help_text")}
                </p>
              </form>
            )}

            <div className="pt-6 border-t">
              <p className="text-xs text-center text-muted-foreground">
                {t('dashboard.login.no_profile')}{' '}
                <Link href="/" className="text-primary hover:underline font-medium">
                  {t('dashboard.login.activate_free')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
