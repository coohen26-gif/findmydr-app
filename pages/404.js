import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { SiteHeader } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/Button";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  };
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Head>
        <title>Page introuvable — FindMyDoctor.ae</title>
        <meta name="description" content="Cette page n'existe pas. Retournez à l'annuaire FindMyDoctor.ae pour trouver un médecin ou dentiste DHA-licensé à Dubai." />
        <meta name="robots" content="noindex" />
      </Head>
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-extrabold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-2xl font-extrabold mb-2">
            Page introuvable
          </h1>
          <p className="text-muted-foreground mb-8 text-pretty">
            Cette page n&apos;existe pas ou a été déplacée. Utilisez la recherche
            pour trouver un médecin ou dentiste à Dubai.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Search className="h-4 w-4" /> Rechercher un médecin
              </Button>
            </Link>
            <a href="https://findmydentist.ae">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                🦷 Trouver un dentiste
              </Button>
            </a>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary underline underline-offset-4">
              <ArrowLeft className="h-3 w-3 inline" /> Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
