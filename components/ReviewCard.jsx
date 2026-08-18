import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { Card } from './Card';

export function ReviewCard({ name, rating, text, date, responseText, responseAt }) {
  const { t } = useTranslation('common');
  return (
    <div className="border border-border rounded-xl p-5 bg-white">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={name} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm">{name}</h4>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-300'}`} />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      {responseText && (
        <div className="mt-3 pl-3 py-2 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg">
          <div className="text-xs font-bold text-primary mb-1">
            {t('review.practitioner_reply', 'Réponse du praticien')}
            {responseAt && <span className="font-normal text-muted-foreground"> · {responseAt}</span>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{responseText}</p>
        </div>
      )}
    </div>
  );
}

export function ReviewsSection({ className, reviews = [], reviewUrl }) {
  const { t } = useTranslation('common');
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold">{t('review.title', 'Avis patients')}</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted-foreground">{reviews.length} {t('review.count_label', 'avis')}</span>
        )}
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(r => (
            <ReviewCard
              key={r.id}
              name={r.author_name || t('review.anonymous', 'Patient')}
              rating={r.rating}
              text={r.text}
              date={(r.visit_date || r.created_at || '').toString().slice(0, 10)}
              responseText={r.response_text}
              responseAt={(r.response_at || '').toString().slice(0, 10)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('review.no_reviews_yet', "Pas encore d'avis - soyez le premier")}
          {reviewUrl && (
            <> · <a href={reviewUrl} className="text-primary hover:underline">{t('review.leave_review', 'Laisser un avis')}</a></>
          )}
        </p>
      )}
    </div>
  );
}
