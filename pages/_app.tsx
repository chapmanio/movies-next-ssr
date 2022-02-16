import type { AppContext, AppProps } from 'next/app';
import App from 'next/app';
import Head from 'next/head';

import ListModal from '../components/lists/ListModal';

import { UserProvider } from '../hooks/useUser';
import { ListProvider } from '../hooks/useList';
import { ListModalProvider } from '../hooks/useListModal';

import '../styles/globals.css';

const MoviesApp = ({ Component, pageProps }: AppProps) => {
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
        <ListProvider>
          <ListModalProvider>
            <Component {...pageProps} />

            <ListModal />
          </ListModalProvider>
        </ListProvider>
      </UserProvider>
    </>
  );
};

MoviesApp.getInitialProps = async (appContext: AppContext) => {
  console.log('app', appContext.ctx.req?.headers.cookie);

  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  return { ...appProps };
};

export default MoviesApp;
