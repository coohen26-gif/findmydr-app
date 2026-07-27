import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from "next/head";
import Link from "next/link";

export async function getServerSideProps({ locale, req }) {
  if (!locale) {
    try { locale = req?.cookies?.NEXT_LOCALE; } catch (e) {}
  }
  if (!locale || !['fr','en','ar','zh','ru','fa'].includes(locale)) locale = 'en';
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function Verify() {
  const { t } = useTranslation('common');

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
      <Head><title>{t('dashboard.verify.loading_title')}</title></Head>
      <div className="text-center">
        <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('dashboard.verify.loading_title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.verify.loading_help')} <Link href="/dashboard/login" className="text-primary hover:underline">click here</Link>.</p>
      </div>
    </div>
  );
}
