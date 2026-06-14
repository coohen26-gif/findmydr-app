/**
 * pages/contact.js
 * Contact page with form (POST to /api/contact) + direct contact info.
 */
import * as React from 'react';
import Head from 'next/head';
import { Mail, MessageCircle, MapPin, Phone, Send, Loader2, Check } from 'lucide-react';
import { SiteHeader } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Input } from '../components/Input';

export async function getServerSideProps({ req }) {
  const host = req.headers.host || '';
  const isDentist = host.includes('findmydentist');
  return { props: { isDentist } };
}

const CONTACTS = [
  { icon: Mail,          label: 'Email',       value: 'contact@findmydr.ae',     href: 'mailto:contact@findmydr.ae' },
  { icon: MessageCircle, label: 'WhatsApp',    value: '+971 50 000 0000',         href: 'https://wa.me/971500000000' },
  { icon: MapPin,        label: 'Adresse',     value: 'Dubai Internet City, UAE', href: null },
  { icon: Phone,         label: 'Téléphone',   value: '+971 4 000 0000',         href: 'tel:+97140000000' },
];

export default function Contact({ isDentist }) {
  const [form, setForm] = React.useState({ name: '', email: '', subject: 'general', message: '' });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => {});
      setSent(true);
      setForm({ name: '', email: '', subject: 'general', message: '' });
      setTimeout(() => setSent(false), 4000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Contact — FindMyDoctor.ae</title>
        <meta name="description" content="Contactez l'équipe FindMyDoctor.ae : support, partenariats, presse." />
      </Head>
      <SiteHeader />

      <section className="gradient-hero text-white py-16 md:py-20">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Contactez-nous</h1>
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
