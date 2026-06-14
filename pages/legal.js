/**
 * pages/legal.js
 * Legal hub: tabs for Terms (CGU), Privacy (RGPD + DIFC Data Law UAE), Cookies, Legal Notice.
 * Complies with UAE Federal Decree-Law No. 45/2021 (Personal Data Protection) + DHA Health Data Law No. 2/2019.
 */
import * as React from 'react';
import Head from 'next/head';
import { ChevronDown, Shield, FileText, Cookie, Building2 } from 'lucide-react';
import { SiteHeader } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { cn } from '../lib/utils';

export async function getServerSideProps({ req }) {
  const host = req.headers.host || '';
  const isDentist = host.includes('findmydentist');
  return { props: { isDentist } };
}

const SECTIONS = [
  {
    id: 'legal-notice',
    icon: Building2,
    title: 'Mentions légales',
    body: (
      <>
        <h3>Éditeur du site</h3>
        <p>
          <strong>FindMyDoctor.ae</strong> est édité par FindMyDoctor FZ-LLC, société de droit émirien enregistrée à Dubai Internet City,
          sous le numéro de licence TRN 100000000000000. Siège social : Office 301, Building 16, Dubai Internet City, Dubai, UAE.
        </p>
        <p>
          Directrice de la publication : Cohen (contact@findmydr.ae). Hébergeur : Hostinger International Ltd., 61 Lordou Vironos Street,
          6023 Larnaca, Chypre. Le site est hébergé sur un VPS à Dubaï (myclaude, IP 76.13.50.38).
        </p>

        <h3>Propriété intellectuelle</h3>
        <p>
          L'ensemble du contenu (textes, images, logos, base de données des praticiens) est protégé par les lois émiriennes et internationales
          sur la propriété intellectuelle. Toute reproduction sans autorisation écrite préalable est interdite.
        </p>
        <p>
          Les données des praticiens proviennent du registre public <strong>Sheryan</strong> de la Dubai Health Authority (DHA) et sont
          utilisées conformément à leurs conditions d'utilisation.
        </p>
      </>
    ),
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Conditions Générales d\'Utilisation (CGU)',
    body: (
      <>
        <h3>1. Objet</h3>
        <p>
          Les présentes CGU régissent l'utilisation du site findmydr.ae et findmydentist.ae (ci-après "la Plateforme"), édités par
          FindMyDoctor FZ-LLC. En accédant à la Plateforme, vous acceptez ces CGU sans réserve.
        </p>

        <h3>2. Services</h3>
        <p>
          La Plateforme est un annuaire en ligne référençant les praticiens de santé (médecins, dentistes) titulaires d'une licence DHA
          valide à Dubai. Les services sont gratuits pour les patients. Les praticiens peuvent souscrire à des plans payants (Free, Premium, Pro).
        </p>

        <h3>3. Inscription et compte</h3>
        <p>
          L'accès aux fonctionnalités basiques est libre. Pour gérer un profil praticien, une inscription par email (magic link) est requise.
          Vous êtes responsable de la confidentialité de votre compte et de toutes les actions effectuées depuis celui-ci.
        </p>

        <h3>4. Données des praticiens</h3>
        <p>
          Les praticiens inscrits certifient que toutes les informations fournies sont exactes et à jour. FindMyDoctor FZ-LLC se réserve
          le droit de vérifier les informations via l'API officielle Sheryan de la DHA. Toute fausse déclaration entraîne la suspension
          immédiate du compte.
        </p>

        <h3>5. Plans payants et remboursements</h3>
        <p>
          Les plans Premium (200 AED/mois) et Pro (500 AED/mois) sont facturés mensuellement, sans engagement. Le paiement s'effectue par
          carte bancaire via Stripe. Vous pouvez annuler à tout moment ; votre plan reste actif jusqu'à la fin de la période payée.
          Aucun remboursement partiel n'est effectué en cas d'annulation en cours de mois.
        </p>

        <h3>6. Responsabilité</h3>
        <p>
          FindMyDoctor FZ-LLC s'efforce de fournir des informations exactes mais ne garantit pas l'exhaustivité ou l'absence d'erreurs.
          La Plateforme ne remplace pas un avis médical. En cas d'urgence, composez le <strong>998</strong> (ambulance Dubai).
        </p>

        <h3>7. Suspension et résiliation</h3>
        <p>
          Nous nous réservons le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU, de comportement
          frauduleux, ou de non-paiement des plans payants.
        </p>

        <h3>8. Droit applicable</h3>
        <p>
          Les présentes CGU sont régies par le droit des Émirats Arabes Unis. Tout litige sera soumis à la compétence exclusive des
          tribunaux de Dubai (DIFC).
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Politique de confidentialité',
    body: (
      <>
        <p>
          Conformément au <strong>Federal Decree-Law No. 45/2021</strong> sur la protection des données personnelles aux Émirats
          Arabes Unis, au <strong>DIFC Data Protection Law No. 5/2020</strong>, au <strong>DHA Health Data Law No. 2/2019</strong>, et au
          Règlement Général sur la Protection des Données (RGPD) pour les résidents européens, nous nous engageons à protéger votre vie privée.
        </p>

        <h3>1. Responsable du traitement</h3>
        <p>
          Le responsable du traitement est FindMyDoctor FZ-LLC (Dubai Internet City, UAE). Pour toute question :{' '}
          <a href="mailto:privacy@findmydr.ae" className="text-primary hover:underline">privacy@findmydr.ae</a>.
        </p>

        <h3>2. Données collectées</h3>
        <ul>
          <li><strong>Données patients (consultation) :</strong> aucune donnée n'est collectée lors de la simple consultation de l'annuaire.</li>
          <li><strong>Données praticiens (inscription) :</strong> email, nom, spécialité, clinique, langues parlées, photo (optionnelle), téléphone, WhatsApp, tarifs.</li>
          <li><strong>Données de connexion :</strong> adresse IP anonymisée, pages visitées, durée de session (analytics).</li>
          <li><strong>Cookies :</strong> voir section dédiée ci-dessous.</li>
        </ul>

        <h3>3. Finalités du traitement</h3>
        <ul>
          <li>Fourniture et amélioration du service d'annuaire.</li>
          <li>Vérification de l'identité des praticiens (via DHA Sheryan).</li>
          <li>Communication avec les praticiens (emails de service, magic links).</li>
          <li>Statistiques d'usage agrégées et anonymisées.</li>
          <li>Sécurité et prévention de la fraude.</li>
        </ul>

        <h3>4. Base légale</h3>
        <p>
          Le traitement est fondé sur (a) l'exécution du contrat (inscription praticien), (b) le consentement (cookies non-essentiels,
          marketing), (c) l'intérêt légitime (amélioration du service, sécurité), (d) une obligation légale (facturation, comptabilité).
        </p>

        <h3>5. Destinataires des données</h3>
        <p>
          Vos données sont hébergées à Dubaï (VPS myclaude) et ne sont jamais vendues. Elles peuvent être partagées avec :
        </p>
        <ul>
          <li>Stripe (paiements) — données de facturation uniquement</li>
          <li>Brevo (emails) — email et nom pour l'envoi des magic links</li>
          <li>Google Analytics (analytics) — données anonymisées</li>
          <li>Autorités légales (DHA, police) sur demande judiciaire</li>
        </ul>

        <h3>6. Durée de conservation</h3>
        <p>
          Les données des comptes praticiens sont conservées tant que le compte est actif, puis supprimées après 3 ans d'inactivité.
          Les données de facturation sont conservées 7 ans (obligation comptable UAE).
        </p>

        <h3>7. Vos droits</h3>
        <p>Vous disposez à tout moment des droits suivants :</p>
        <ul>
          <li><strong>Accès :</strong> obtenir une copie de vos données personnelles.</li>
          <li><strong>Rectification :</strong> corriger des données inexactes.</li>
          <li><strong>Suppression :</strong> demander l'effacement de vos données.</li>
          <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré (JSON/CSV).</li>
          <li><strong>Opposition :</strong> vous opposer à un traitement.</li>
          <li><strong>Retrait du consentement :</strong> pour les traitements fondés sur le consentement.</li>
        </ul>
        <p>
          Pour exercer ces droits : <a href="mailto:privacy@findmydr.ae" className="text-primary hover:underline">privacy@findmydr.ae</a>.
          Réponse sous 30 jours. En cas de réclamation, vous pouvez saisir l'autorité UAE (UAE Data Office) ou la CNIL.
        </p>

        <h3>8. Sécurité</h3>
        <p>
          Vos données sont protégées par : chiffrement HTTPS/TLS, mots de passe hashés (bcrypt), authentification JWT sécurisée,
          rate limiting, en-têtes de sécurité HTTP (HSTS, CSP, X-Frame-Options), sauvegardes quotidiennes chiffrées, monitoring 24/7.
        </p>

        <h3>9. Transferts internationaux</h3>
        <p>
          Les données sont hébergées à Dubaï. Les seuls transferts hors UAE concernent Stripe (paiements, USA) et Brevo (emails, France),
          encadrés par les clauses contractuelles types de la Commission européenne.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Politique des cookies',
    body: (
      <>
        <h3>Qu'est-ce qu'un cookie ?</h3>
        <p>
          Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web. Il permet au site de mémoriser
          vos actions et préférences pendant une durée déterminée.
        </p>

        <h3>Cookies utilisés</h3>
        <ul>
          <li>
            <strong>Cookies strictement nécessaires :</strong> session d'authentification (cookie HttpOnly <code>dmd_session</code>), préférences
            de domaine. Ces cookies sont indispensables au fonctionnement du site et ne nécessitent pas de consentement.
          </li>
          <li>
            <strong>Cookies de mesure d'audience :</strong> Google Analytics 4 (anonymisé). Utilisé pour comprendre comment les visiteurs
            utilisent le site et l'améliorer. Vous pouvez vous y opposer.
          </li>
          <li>
            <strong>Aucun cookie publicitaire :</strong> nous n'utilisons pas de cookies de ciblage publicitaire (Meta, Google Ads, etc.).
          </li>
        </ul>

        <h3>Gestion de vos préférences</h3>
        <p>
          Vous pouvez à tout moment modifier vos préférences via le bouton "Gérer les cookies" en bas de page, ou configurer votre navigateur
          pour refuser les cookies.
        </p>

        <h3>Durée de conservation</h3>
        <p>
          Les cookies de session sont supprimés à la fermeture du navigateur. Le cookie <code>dmd_session</code> expire après 7 jours.
          Les cookies d'analytics expirent après 13 mois maximum.
        </p>
      </>
    ),
  },
];

export default function Legal({ isDentist }) {
  const [open, setOpen] = React.useState('legal-notice');

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Mentions légales & confidentialité — FindMyDoctor.ae</title>
        <meta name="description" content="Mentions légales, CGU, politique de confidentialité et cookies conformes DIFC + RGPD + UAE Federal Decree-Law No. 45/2021." />
      </Head>
      <SiteHeader />

      <section className="gradient-hero text-white py-12">
        <div className="container-narrow text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Informations légales</h1>
          <p className="text-white/85">Conformité UAE, DIFC, DHA et RGPD</p>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="max-w-4xl mx-auto space-y-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isOpen = open === s.id;
            return (
              <Card key={s.id} className="overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold flex-1">{s.title}</h2>
                  <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="border-t">
                    <div className="p-6 prose prose-sm max-w-none text-muted-foreground [&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_strong]:text-foreground">
                      {s.body}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          <Card className="p-5 bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              Pour toute question : <a href="mailto:legal@findmydr.ae" className="text-primary font-semibold hover:underline">legal@findmydr.ae</a>
            </p>
          </Card>
        </div>
      </section>
          <Footer />
</div>
  );
}
