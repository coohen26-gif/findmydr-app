import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Check, X, Shield, Award, Building2, ChevronLeft, Loader2, ExternalLink, Download, CreditCard, ArrowRight } from "lucide-react";
import { SiteHeader } from "../../components/Header";
import { Button } from "../../components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/Card";
import { Badge } from "../../components/Badge";

const PLAN_LABELS = { free: "Free", premium: "Premium", pro: "Pro" };
const PLAN_SEARCH_RANK = { free: 0, premium: 10, pro: 20 };

export default function BillingPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [events, setEvents] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/dashboard/billing-events")
      .then((r) => r.json())
      .then((d) => {
        if (d.events) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const r = await fetch("/api/stripe/customer-portal", { method: "POST" });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        alert(d.message || "Erreur de connexion Stripe.");
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const currentPlan = user?.plan || "free";
  const planLabel = PLAN_LABELS[currentPlan] || "Free";

  return (
    <div className="min-h-screen bg-muted/30">
      <Head><title>{t('dashboard.billing.title')} — FindMyDoctor.ae</title></Head>
      <SiteHeader user={user} />

      <div className="container-wide py-12">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ChevronLeft className="h-4 w-4" /> Tableau de bord
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{t('dashboard.billing.title')}</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('dashboard.billing.current_plan')}</h2>
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-primary-50 to-cyan-50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                    {currentPlan === "pro" ? (
                      <Building2 className="h-6 w-6 text-white" />
                    ) : currentPlan === "premium" ? (
                      <Award className="h-6 w-6 text-white" />
                    ) : (
                      <Shield className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold">{planLabel}</span>
                      {currentPlan !== "free" && (
                        <Badge variant="premium">
                          {currentPlan === "pro" ? "500 AED/mois" : "200 AED/mois"}
                        </Badge>
                      )}
                    </div>
                    {user?.plan_expires_at ? (
                      <p className="text-sm text-muted-foreground">
                        Renouvellement le{" "}
                        {new Date(user.plan_expires_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {currentPlan === "free"
                          ? "Gratuit à vie. Passez à Premium pour booster votre visibilité."
                          : "Abonnement actif"}
                      </p>
                    )}
                  </div>
                </div>
                {currentPlan !== "free" ? (
                  <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Gérer <ExternalLink className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href="/dashboard/upgrade">
                    <Button variant="default">
                      Passer Premium <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Avantages de votre plan</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { ok: true, text: "Fiche profil publique" },
                  { ok: true, text: "Indexation Google" },
                  { ok: currentPlan !== "free", text: "Photo de profil HD" },
                  { ok: currentPlan !== "free", text: "Bio multilingue (FR/EN/AR)" },
                  { ok: currentPlan !== "free", text: "WhatsApp direct" },
                  { ok: currentPlan !== "free", text: "Prise de RDV en ligne" },
                  { ok: currentPlan !== "free", text: "Statistiques de vues (30j)" },
                  { ok: currentPlan === "pro", text: "Multi-praticiens (jusqu\'à 10)" },
                  { ok: currentPlan === "pro", text: "Support prioritaire 24/7" },
                  { ok: currentPlan !== "free", text: "Boost SEO (top résultats)" },
                  { ok: currentPlan !== "free", text: `Search Rank: ${PLAN_SEARCH_RANK[currentPlan]}` },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {f.ok ? (
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={f.ok ? "text-foreground" : "text-muted-foreground"}>{f.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Historique des paiements</h2>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Aucun paiement enregistré.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="font-medium">{e.event_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(e.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {e.plan && <Badge variant="info">{e.plan}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <CreditCard className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-bold mb-2">Mode de paiement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez votre carte et vos coordonnées de facturation via le portail sécurisé Stripe.
              </p>
              <Button
                variant={currentPlan !== "free" ? "default" : "outline"}
                className="w-full"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accéder au portail Stripe"
                )}
              </Button>
            </Card>

            <Card className="p-6">
              <Download className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-bold mb-2">Factures</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Téléchargez vos factures depuis votre portail Stripe.
              </p>
              <Button variant="outline" className="w-full" onClick={handlePortal} disabled={portalLoading}>
                Voir les factures
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <h3 className="font-bold mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contactez-nous par email pour toute question sur votre facturation.
              </p>
              <a href="mailto:contact@findmydr.ae">
                <Button variant="outline" className="w-full">
                  contact@findmydr.ae
                </Button>
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
