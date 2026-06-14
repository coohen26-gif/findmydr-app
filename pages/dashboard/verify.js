import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function Verify() {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) {
      const { token } = router.query;
      if (token) {
        window.location.href = "/api/auth/verify?token=" + token;
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Head><title>Connexion en cours...</title></Head>
      <div className="text-center">
        <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connexion en cours...</h1>
        <p className="text-muted-foreground">Si rien ne se passe, <Link href="/dashboard/login" className="text-primary hover:underline">cliquez ici</Link>.</p>
      </div>
    </div>
  );
}
