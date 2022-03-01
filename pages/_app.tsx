import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';

import ListModal from '../components/lists/ListModal';

import { UserProvider } from '../hooks/useUser';
import { ListProvider } from '../hooks/useList';
import { ListModalProvider } from '../hooks/useListModal';

import 'nprogress/nprogress.css';
import '../styles/globals.css';

const MoviesApp = ({ Component, pageProps }: AppProps) => {
  // Hooks
  const router = useRouter();

  // Effects
  useEffect(() => {
    const handleStart = () => {
      NProgress.start();
    };

    const handleStop = () => {
      NProgress.done();
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  // Render
  return (
    <>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <UserProvider initialState={pageProps.user ?? { auth: false }}>
        <ListProvider initialState={{ lists: pageProps.lists ?? undefined }}>
          <ListModalProvider>
            <Component {...pageProps} />

            <ListModal />
          </ListModalProvider>
        </ListProvider>
      </UserProvider>
    </>
  );
};

export default MoviesApp;
