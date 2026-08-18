import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Save, Loader2, ChevronLeft, Check, Image as ImageIcon, User, FileText, Briefcase, Phone, Globe, Mail, Camera, Sparkles } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';

const SECTIONS = [
  { id: 'photo', label: 'Photo', icon: Camera },
  { id: 'names', label: 'Noms', icon: User },
  { id: 'bio', label: 'Bio', icon: FileText },
  { id: 'practice', label: 'Spécialités', icon: Briefcase },
  { id: 'contact', label: 'Contact', icon: Phone },
];

const LANGUAGES = ['Français', 'English', 'العربية', 'हिन्दी', 'Español', 'Português', 'Русский', '中文'];

// Normalizes a phone/WhatsApp number to E.164 UAE format (+971XXXXXXXXX).
// Accepts numbers already in +971 format, or local UAE mobile format (0XXXXXXXXX).
// Returns { value, error } — value is the normalized string (or the original
// input untouched when invalid), error is a user-facing message or null.
function normalizeUAEPhone(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { value: '', error: null };

  const digits = trimmed.replace(/[^\d]/g, '');
  const invalidMessage = 'Numéro invalide. Format attendu : +971 5X XXX XXXX ou 0X XXX XXXX';

  if (digits.startsWith('971')) {
    const local = digits.slice(3);
    if (/^\d{8,9}$/.test(local)) {
      return { value: '+971' + local, error: null };
    }
    return { value: trimmed, error: invalidMessage };
  }

  if (digits.startsWith('0')) {
    const local = digits.slice(1);
    if (/^\d{8,9}$/.test(local)) {
      return { value: '+971' + local, error: null };
    }
    return { value: trimmed, error: invalidMessage };
  }

  return { value: trimmed, error: invalidMessage };
}

export async function getServerSideProps({ locale, req }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function Profile() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [completeness, setCompleteness] = React.useState(0);
  const [activeSection, setActiveSection] = React.useState('photo');
  const [phoneError, setPhoneError] = React.useState('');
  const [whatsappError, setWhatsappError] = React.useState('');

  React.useEffect(() => {
    fetch('/api/dashboard/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setForm({
            full_name_fr: d.user.full_name_fr || '',
            full_name_en: d.user.full_name_en || '',
            full_name_ar: d.user.full_name_ar || '',
            bio_fr: d.user.bio_fr || '',
            bio_en: d.user.bio_en || '',
            bio_ar: d.user.bio_ar || '',
            photo_url: d.user.photo_url || '',
            specialties: d.user.specialties || [],
            languages_spoken: d.user.languages_spoken || [],
            phone: d.user.phone || '',
            whatsapp: d.user.whatsapp || '',
            consultation_fee_aed: d.user.consultation_fee_aed || '',
            instagram: d.user.instagram || '',
            linkedin: d.user.linkedin || '',
            google_maps_url: d.user.google_maps_url || '',
          });
          setCompleteness(d.user.profile_completeness || 0);
        } else {
          router.push('/dashboard/login');
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const phoneResult = normalizeUAEPhone(form.phone);
    const whatsappResult = normalizeUAEPhone(form.whatsapp);
    setPhoneError(phoneResult.error || '');
    setWhatsappError(whatsappResult.error || '');
    if (phoneResult.error || whatsappResult.error) {
      return;
    }

    const normalizedForm = { ...form, phone: phoneResult.value, whatsapp: whatsappResult.value };

    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedForm),
      });
      const d = await r.json();
      if (d.profile_completeness !== undefined) {
        setForm(normalizedForm);
        setCompleteness(d.profile_completeness);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (spec) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(spec)
        ? f.specialties.filter(s => s !== spec)
        : [...f.specialties, spec],
    }));
  };

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages_spoken: f.languages_spoken.includes(lang)
        ? f.languages_spoken.filter(l => l !== lang)
        : [...f.languages_spoken, lang],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const userName = form.full_name_en || user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-muted/30">
      <Head>
        <title>Mon profil — FindMyDoctor.ae</title>
      </Head>

      <SiteHeader user={user} />

      <div className="container-wide py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
            <ChevronLeft className="h-4 w-4" /> Tableau de bord
          </Link>
          <h1 className="text-3xl font-extrabold">Mon profil</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre présentation publique sur FindMyDoctor.ae
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* SIDEBAR */}
          <div className="space-y-4">
            <Card className="p-6 text-center">
              <Avatar name={userName} size="2xl" verified className="mx-auto mb-4" />
              <h3 className="font-bold">Dr. {userName}</h3>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              <Badge variant={user.plan === 'premium' ? 'premium' : 'secondary'} className="mb-4">
                {user.plan === 'premium' ? '⭐ Premium' : 'Free'}
              </Badge>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Complétion</span>
                  <span className="font-bold">{completeness}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      completeness < 30 ? 'bg-destructive' : completeness < 70 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-2">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      activeSection === s.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </Card>
          </div>

          {/* CONTENT */}
          <div className="space-y-6">
            {activeSection === 'photo' && (
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-extrabold mb-1">Photo de profil</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Les profils avec photo reçoivent <strong className="text-foreground">5x plus de vues</strong>.
                </p>
                <div className="flex items-center gap-6">
                  <Avatar name={userName} size="2xl" className="ring-4 ring-white shadow-lg" />
                  <div className="flex-1">
                    <Input
                      placeholder="URL de votre photo (https://...)"
                      value={form.photo_url}
                      onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Formats acceptés : JPG, PNG. Taille recommandée : 400×400px.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeSection === 'names' && (
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-extrabold mb-1">Noms multilingues</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Comment vous apparaîtrez sur l'annuaire dans chaque langue.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇫🇷 Nom français</label>
                    <Input
                      placeholder="Dr. Jean Dupont"
                      value={form.full_name_fr}
                      onChange={e => setForm(f => ({ ...f, full_name_fr: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇬🇧 Nom anglais</label>
                    <Input
                      placeholder="Dr. John Smith"
                      value={form.full_name_en}
                      onChange={e => setForm(f => ({ ...f, full_name_en: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇦🇪 Nom arabe</label>
                    <Input
                      placeholder="د. جون سميث"
                      value={form.full_name_ar}
                      onChange={e => setForm(f => ({ ...f, full_name_ar: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeSection === 'bio' && (
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-extrabold mb-1">Présentation</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Décrivez votre parcours, vos expertises et votre approche patient.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇫🇷 Bio française</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Diplômé de..."
                      value={form.bio_fr}
                      onChange={e => setForm(f => ({ ...f, bio_fr: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇬🇧 English bio</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Graduated from..."
                      value={form.bio_en}
                      onChange={e => setForm(f => ({ ...f, bio_en: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">🇦🇪 Bio arabe</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="خريج من..."
                      value={form.bio_ar}
                      onChange={e => setForm(f => ({ ...f, bio_ar: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeSection === 'practice' && (
              <div className="space-y-6">
                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-extrabold mb-1">Spécialités</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Sélectionnez toutes vos spécialités.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Cardiologie', 'Dermatologie', 'Pédiatrie', 'Gynécologie', 'Médecine générale', 'Neurologie', 'Ophtalmologie', 'Orthopédie', 'ORL', 'Dentisterie', 'Esthétique', 'Implantologie'].map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.specialties.includes(s)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {form.specialties.includes(s) && <Check className="h-3 w-3 inline mr-1" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-extrabold mb-1">Langues parlées</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Indiquez les langues dans lesquelles vous consultez.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(l => (
                      <button
                        key={l}
                        onClick={() => toggleLanguage(l)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.languages_spoken.includes(l)
                            ? 'bg-cyan-500 text-white border-cyan-500'
                            : 'bg-white text-foreground border-border hover:border-cyan-500'
                        }`}
                      >
                        {form.languages_spoken.includes(l) && <Check className="h-3 w-3 inline mr-1" />}
                        {l}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeSection === 'contact' && (
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-extrabold mb-1">Contact</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Vos coordonnées pour vos patients.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">📞 Téléphone</label>
                    <Input
                      placeholder="+971 50 123 4567"
                      value={form.phone}
                      onChange={e => {
                        setForm(f => ({ ...f, phone: e.target.value }));
                        if (phoneError) setPhoneError('');
                      }}
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive mt-1">{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">💬 WhatsApp</label>
                    <Input
                      placeholder="+971 50 123 4567"
                      value={form.whatsapp}
                      onChange={e => {
                        setForm(f => ({ ...f, whatsapp: e.target.value }));
                        if (whatsappError) setWhatsappError('');
                      }}
                    />
                    {whatsappError && (
                      <p className="text-xs text-destructive mt-1">{whatsappError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">💰 Tarif consultation (AED)</label>
                    <Input
                      type="number"
                      placeholder="300"
                      value={form.consultation_fee_aed}
                      onChange={e => setForm(f => ({ ...f, consultation_fee_aed: e.target.value }))}
                    />
                  </div>
                  <hr className="border-border my-2" />
                  <h3 className="text-lg font-extrabold mb-1">Réseaux sociaux</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Liens visibles sur votre profil public.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold mb-2">📸 Instagram</label>
                    <Input
                      placeholder="https://instagram.com/votrecompte"
                      value={form.instagram}
                      onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">💼 LinkedIn</label>
                    <Input
                      placeholder="https://linkedin.com/in/votreprofil"
                      value={form.linkedin}
                      onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">📍 Google Maps URL</label>
                    <Input
                      placeholder="https://maps.google.com/?q=..."
                      value={form.google_maps_url}
                      onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Sticky save bar */}
            <Card className="sticky bottom-4 p-4 flex items-center justify-between shadow-xl z-10">
              <div className="flex items-center gap-3">
                {saved && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <Check className="h-4 w-4" /> Profil sauvegardé
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  Complétion : <strong className="text-foreground">{completeness}%</strong>
                </span>
              </div>
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Enregistrer
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
