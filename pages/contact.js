/**
 * pages/contact.js
 * Contact page with form (POST to /api/contact) + direct contact info.
 */
import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Mail, MapPin, Send, Loader2, Check, AlertCircle } from 'lucide-react';
import { SiteHeader } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Input } from '../components/Input';

export async function getServerSideProps({ req, locale }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  const host = req.headers.host || '';
  const isDentist = host.includes('findmydentist');
  return { props: { isDentist, ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function Contact({ isDentist }) {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const contactEmail = isDentist ? 'contact@findmydentist.ae' : 'contact@findmydr.ae';
  const CONTACTS = [
    { icon: Mail,   label: 'Email',   value: contactEmail,               href: `mailto:${contactEmail}` },
    { icon: MapPin, label: 'Adresse', value: 'Dubai Internet City, UAE', href: null },
  ];
  const [form, setForm] = React.useState({ name: '', email: '', subject: 'general', message: '' });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.sent) {
        setError(data.error || `Envoi indisponible pour le moment. Écrivez-nous directement à ${contactEmail}.`);
        return;
      }
      setSent(true);
      setForm({ name: '', email: '', subject: 'general', message: '' });
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError('Erreur réseau. Réessayez ou écrivez-nous directement.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{t('meta.contact_title')}</title>
        <meta name="description" content={t('meta.contact_description')} />
        <link rel="alternate" hrefLang="fr" href={`https://findmydr.ae/fr${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="en" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="ar" href={`https://findmydr.ae/ar${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://findmydr.ae/en${router.asPath.replace(/^\/(fr|en|ar)/, '')}`} />
      </Head>
      <SiteHeader isDentist={isDentist} />

      <section className="gradient-hero text-white py-16 md:py-20">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">{t('nav.contact')}</h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto">
            Réponse sous 24h ouvrées. Pour les partenariats cliniques, utilisez le sujet "Partenariat".
          </p>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {CONTACTS.map((c, i) => {
            const Icon = c.icon;
            const Wrapper = c.href ? 'a' : 'div';
            return (
              <Card key={i} className="p-5 hover:shadow-md transition-shadow">
                <Wrapper href={c.href || undefined} className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{c.label}</div>
                    <div className="font-semibold">{c.value}</div>
                  </div>
                </Wrapper>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="font-semibold">Message envoyé !</p>
                  <p className="text-sm text-muted-foreground mt-1">Nous vous répondrons sous 24h ouvrées.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Nom</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Email</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Sujet</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
                    >
                      <option value="general">Question générale</option>
                      <option value="partnership">Partenariat clinique</option>
                      <option value="press">Presse / Média</option>
                      <option value="support">Support technique</option>
                      <option value="billing">Facturation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={6}
                      className="w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive text-sm rounded-md p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button type="submit" size="lg" disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Envoyer</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vous êtes médecin ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Activez votre profil gratuit en 2 minutes. Nous pré-remplissons vos informations depuis le registre DHA officiel.
              </p>
              <a href="/dashboard/login" className="block">
                <Button className="w-full" size="lg">Activer mon profil →</Button>
              </a>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-semibold mb-2">Besoin d'aide ?</p>
                <p className="text-sm text-muted-foreground">
                  Consultez notre <a href="/legal" className="text-primary hover:underline">FAQ et CGU</a>, ou écrivez-nous.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
          <Footer />
</div>
  );
}
