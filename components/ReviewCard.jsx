import * as React from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { Card } from './Card';

const MOCK_REVIEWS = [
  { id: 'r1', name: 'Sophie Martin', rating: 5, text: 'Excellent médecin ! À l\'écoute et très professionnel. Je recommande vivement.', date: '2026-05-28', avatar: null },
  { id: 'r2', name: 'Ahmed Benali', rating: 5, text: 'Très bonne consultation. Le cabinet est bien situé et l\'accueil est chaleureux.', date: '2026-05-15', avatar: null },
  { id: 'r3', name: 'Marie Dubois', rating: 4, text: 'Bon praticien, rendez-vous facile à obtenir. Seul bémol : un peu d\'attente le jour de la consultation.', date: '2026-05-02', avatar: null },
  { id: 'r4', name: 'Karim Othman', rating: 5, text: 'Je suis suivi depuis 2 ans, toujours au top. Disponible et à l\'écoute.', date: '2026-04-20', avatar: null },
];

export function ReviewCard({ name, rating, text, date }) {
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
    </div>
  );
}

export function ReviewsSection({ className }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold">Avis patients</h2>
        <span className="text-sm text-muted-foreground">{MOCK_REVIEWS.length} avis</span>
      </div>
      <div className="space-y-3">
        {MOCK_REVIEWS.map(r => (
          <ReviewCard key={r.id} {...r} />
        ))}
      </div>
    </div>
  );
}
