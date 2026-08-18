import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChevronLeft, Star, MessageSquare, X, Loader2, Clock } from 'lucide-react';
import { SiteHeader } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Badge } from '../../components/Badge';

export default function ReviewsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [reviews, setReviews] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [respondingTo, setRespondingTo] = React.useState(null);
  const [apiAvailable, setApiAvailable] = React.useState(true);
  const [replyText, setReplyText] = React.useState('');
  const [replySubmitting, setReplySubmitting] = React.useState(false);
  const [replyError, setReplyError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/profile')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.user) setUser(d.user);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const id = user.dha_license || user.id;
    if (!id) return;
    let cancelled = false;
    fetch(`/api/reviews/${id}?all=true`)
      .then((r) => {
        if (!r.ok) throw new Error('api');
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        if (d.reviews && Array.isArray(d.reviews)) setReviews(d.reviews);
      })
      .catch(() => {
        if (cancelled) setApiAvailable(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const openReply = (reviewId) => {
    if (respondingTo === reviewId) {
      setRespondingTo(null);
      return;
    }
    setRespondingTo(reviewId);
    setReplyText('');
    setReplyError('');
  };

  const submitReply = async (reviewId) => {
    const text = replyText.trim();
    if (!text || replySubmitting) return;
    setReplySubmitting(true);
    setReplyError('');
    try {
      const res = await fetch('/api/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, response_text: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setReplyError(data.error || t('dashboard.reviews.reply_error'));
        setReplySubmitting(false);
        return;
      }
      setReviews((prev) => prev.map((r) => (
        r.id === reviewId
          ? { ...r, response_text: data.review.response_text, response_at: data.review.response_at }
          : r
      )));
      setRespondingTo(null);
      setReplyText('');
      setReplySubmitting(false);
    } catch {
      setReplyError(t('dashboard.reviews.reply_error'));
      setReplySubmitting(false);
    }
  };

  // NOTE: there is currently no mechanism anywhere in this codebase that ever marks a review
  // as "verified" (the DB column is always inserted as false and nothing ever updates it), so
  // filtering/displaying by that flag would silently show nothing. "Pending" here means
  // "awaiting a professional's response", independent of that dead flag.
  const filtered = reviews.filter((r) => {
    if (filter === 'responded') return r.response_text;
    if (filter === 'pending') return !r.response_text;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const stats = {
    total: reviews.length,
    avgRating: reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0',
    pending: reviews.filter((r) => !r.response_text).length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Head><title>{t('dashboard.reviews.page_title')} — FindMyDoctor.ae</title></Head>
      <SiteHeader user={user} />

      <div className="container-wide py-12">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ChevronLeft className="h-4 w-4" /> {t('nav.dashboard')}
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{t('dashboard.reviews.title')}</h1>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">{t('dashboard.reviews.total')}</div>
            <div className="text-3xl font-extrabold mt-2">{stats.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">{t('dashboard.reviews.avg_rating')}</div>
            <div className="text-3xl font-extrabold mt-2 flex items-center gap-2">
              {stats.avgRating} <Star className="h-5 w-5 text-amber-500 fill-current" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">{t('dashboard.reviews.pending_response')}</div>
            <div className="text-3xl font-extrabold mt-2 flex items-center gap-2">
              {stats.pending} <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: t('dashboard.reviews.filter_all') },
            { key: 'pending', label: t('dashboard.reviews.filter_pending') },
            { key: 'responded', label: t('dashboard.reviews.filter_responded') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-primary text-white' : 'bg-white border text-foreground hover:bg-muted'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!apiAvailable && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <strong>API indisponible.</strong> Le endpoint <code>/api/reviews/*</code> n'est pas encore déployé. Cette page est un placeholder structurellement complet.
          </div>
        )}

        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('dashboard.reviews.no_reviews')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= (review.rating || 0) ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="font-semibold mb-1">{review.author_name || t('dashboard.reviews.anonymous')}</div>
                    <p className="text-foreground/80 mb-3">{review.text}</p>
                    {review.response_text && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                        <div className="text-xs font-semibold text-primary mb-1">{t('dashboard.reviews.your_response')}</div>
                        <p className="text-sm">{review.response_text}</p>
                      </div>
                    )}
                  </div>
                  {!review.response_text && (
                    <Button size="sm" variant="outline" onClick={() => openReply(review.id)}>
                      {t('dashboard.reviews.respond')}
                    </Button>
                  )}
                </div>
                {respondingTo === review.id && (
                  <div className="mt-4 pt-4 border-t">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      placeholder={t('dashboard.reviews.response_placeholder')}
                      className="flex w-full rounded-md border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={replySubmitting}
                    />
                    {replyError && (
                      <p className="text-sm text-red-600 mt-2">{replyError}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => submitReply(review.id)}
                        disabled={replySubmitting || !replyText.trim()}
                      >
                        {replySubmitting ? t('dashboard.reviews.sending') : t('dashboard.reviews.send_response')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRespondingTo(null)} disabled={replySubmitting}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export async function getServerSideProps({ locale, req }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      locale,
    },
  };
}
