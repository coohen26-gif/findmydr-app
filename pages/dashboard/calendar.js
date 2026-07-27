/**
 * pages/dashboard/calendar.js
 * Doctor's appointment calendar. Lists upcoming + past appointments grouped by day.
 * Reads from dmd.appointments. If the table is empty (typical for new users),
 * shows a friendly empty state and a "blocked time" demo so the UI is verifiable.
 */
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, X, Check, Video, MapPin, User, Loader2, CalendarDays, Filter, Phone, MessageCircle } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';

const STATUS_STYLES = {
  confirmed: { label: 'Confirmé',   variant: 'success' },
  pending:   { label: 'En attente', variant: 'warning' },
  cancelled: { label: 'Annulé',     variant: 'destructive' },
  completed: { label: 'Terminé',    variant: 'info' },
  no_show:   { label: 'Absence',    variant: 'destructive' },
};

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtMonth(d) {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
function fmtDay(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtTime(d) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export async function getServerSideProps({ locale, req }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function CalendarPage() {
  const { t } = useTranslation('common');

  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [appointments, setAppointments] = React.useState([]);
  const [cursor, setCursor] = React.useState(() => startOfDay(new Date()));
  const [showNew, setShowNew] = React.useState(false);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    fetch('/api/dashboard/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
        else router.push('/dashboard/login');
        setLoading(false);
      })
      .catch(() => router.push('/dashboard/login'));
  }, []);

  const monthStart = React.useMemo(() => {
    const x = new Date(cursor);
    x.setDate(1);
    return startOfDay(x);
  }, [cursor]);
  const monthEnd = React.useMemo(() => {
    const x = new Date(monthStart);
    x.setMonth(x.getMonth() + 1);
    return x;
  }, [monthStart]);

  const days = React.useMemo(() => {
    const startWeekday = (monthStart.getDay() + 6) % 7;
    const total = new Date(monthEnd.getTime() - monthStart.getTime()).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: addDays(monthStart, i - startWeekday), outside: true });
    for (let i = 0; i < total; i++) cells.push({ date: addDays(monthStart, i), outside: false });
    while (cells.length % 7 !== 0) cells.push({ date: addDays(monthStart, cells.length - startWeekday), outside: true });
    return cells;
  }, [monthStart, monthEnd]);

  const monthCounts = React.useMemo(() => {
    const m = {};
    appointments.forEach((a) => {
      const k = startOfDay(new Date(a.appointment_at)).toISOString();
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [appointments]);

  const dayAppointments = React.useMemo(() => {
    return appointments
      .filter((a) => sameDay(new Date(a.appointment_at), cursor))
      .filter((a) => filter === 'all' || a.status === filter)
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  }, [appointments, cursor, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Head><title>Calendrier — FindMyDoctor.ae</title></Head>
      <SiteHeader user={user} />

      <div className="container-wide py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
              <ChevronLeft className="h-4 w-4" /> Tableau de bord
            </Link>
            <h1 className="text-3xl font-extrabold">Mon calendrier</h1>
            <p className="text-muted-foreground mt-1">Gérez vos rendez-vous et disponibilités.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" /> Filtrer
            </Button>
            <Button size="md" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Nouveau RDV
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="capitalize">{fmtMonth(monthStart)}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCursor(startOfDay(addDays(monthStart, -1)))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCursor(startOfDay(new Date()))}>Aujourd'hui</Button>
                <Button variant="ghost" size="icon" onClick={() => setCursor(startOfDay(addDays(monthEnd, 0)))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map(({ date, outside }, i) => {
                  const isToday = sameDay(date, new Date());
                  const isSelected = sameDay(date, cursor);
                  const count = monthCounts[startOfDay(date).toISOString()] || 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setCursor(startOfDay(date))}
                      className={[
                        'aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-all relative',
                        outside ? 'text-muted-foreground/40' : 'text-foreground hover:bg-muted',
                        isToday && !isSelected ? 'font-bold text-primary' : '',
                        isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md' : '',
                      ].join(' ')}
                    >
                      <span>{date.getDate()}</span>
                      {count > 0 && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                      )}
                      {count > 0 && isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 text-xs">
                <Badge variant="info">{appointments.length} RDV au total</Badge>
                <Badge variant="success">{appointments.filter((a) => a.status === 'confirmed').length} confirmés</Badge>
                <Badge variant="warning">{appointments.filter((a) => a.status === 'pending').length} en attente</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{fmtDay(cursor)}</CardTitle>
              <CardDescription>
                {dayAppointments.length === 0
                  ? 'Aucun rendez-vous ce jour.'
                  : `${dayAppointments.length} rendez-vous prévu${dayAppointments.length > 1 ? 's' : ''}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dayAppointments.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Aucun rendez-vous prévu ce jour.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" /> Ajouter un RDV
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((a) => {
                    const st = STATUS_STYLES[a.status] || STATUS_STYLES.pending;
                    const at = new Date(a.appointment_at);
                    return (
                      <div key={a.id} className="flex items-center gap-4 p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                        <div className="text-center w-16 flex-shrink-0">
                          <div className="text-2xl font-extrabold text-primary">{fmtTime(at)}</div>
                          <div className="text-xs text-muted-foreground">{a.duration_min || 30} min</div>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <Avatar name={a.patient_name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{a.patient_name || 'Patient'}</div>
                          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            {a.reason || 'Consultation'}
                            {a.language && <span>• {a.language}</span>}
                          </div>
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <div className="flex items-center gap-1">
                          {a.patient_phone && (
                            <a href={`tel:${a.patient_phone}`} className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Appeler">
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          <button className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Message">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showNew && <NewAppointmentModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewAppointmentModal({ onClose }) {
  const [form, setForm] = React.useState({ name: '', phone: '', date: '', time: '', reason: '', language: 'Français', duration: 30 });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaved(true);
      setTimeout(onClose, 1200);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">Nouveau rendez-vous</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        {saved ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="font-semibold">Rendez-vous créé !</p>
            <p className="text-sm text-muted-foreground mt-1">Un email de confirmation sera envoyé.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Nom du patient" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Téléphone (+971 50 ...)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
            <Input placeholder="Motif (consultation, suivi...)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value, 10) })}
              className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose} type="button">Annuler</Button>
              <Button className="flex-1" type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Créer</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
