import type { GetServerSideProps, NextPage, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import type { CreditsResponse } from 'moviedb-promise/dist/request-types';
import { CalendarIcon, ClockIcon, FilmIcon, PlusSmIcon } from '@heroicons/react/solid';

import DetailsLayout from '../../components/layouts/Details';
import Rating from '../../components/assets/Rating';
import ListItem from '../../components/lists/ListItem';

import { useListModalDispatch } from '../../hooks/useListModal';

import type { ExtShowResponse } from '../../lib/api';
import { getTvShow, getTvCredits } from '../../lib/api/tvShow';
import { formatRuntime, formatShortDate, formatYear } from '../../lib/dates';
import { formatTvShow } from '../../lib/format';
import { AuthUser, authUser } from '../../lib/api/auth';

// Types
type ServerSideResponse = {
  user: AuthUser;
  tvShow: ExtShowResponse;
  credits?: CreditsResponse;
};

// SSR
export const getServerSideProps: GetServerSideProps<ServerSideResponse> = async ({
  req,
  query,
}) => {
  // Validate params
  if (!query.id) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const tvShowId = parseInt(query.id.toString());

  // Get the tv show
  let tvShow: ExtShowResponse;

  try {
    tvShow = await getTvShow({ id: tvShowId });
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (!tvShow.id) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Get the credits
  let credits: CreditsResponse | undefined;

  try {
    credits = await getTvCredits({ id: tvShowId });
  } catch (error) {
    credits = undefined;
  }

  // Current user
  let user: AuthUser;

  try {
    user = await authUser({ cookie: req.headers.cookie ?? '' });
  } catch (error) {
    user = { auth: false };
  }

  // Return it all!
  return {
    props: {
      user,
      tvShow,
      credits,
    },
  };
};

// Component
const TvShow: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  tvShow,
  credits,
}) => {
  // Hooks
  const listModalDispatch = useListModalDispatch();

  // Render
  return (
    <DetailsLayout>
      <Head>
        <title>{tvShow.name} • Movies</title>
      </Head>

      <div
        className="bg-cover bg-right-top bg-no-repeat sm:bg-[right_-200px_top]"
        style={{
          backgroundImage: tvShow.backdrop_path
            ? `url(https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces/${tvShow.backdrop_path})`
            : undefined,
        }}
      >
        <div className="bg-theme-tv">
          <div className="mx-auto max-w-7xl items-center px-4 py-8 sm:flex sm:px-6 lg:px-8">
            <div className="flex-none self-start sm:w-[300px]">
              <div className="aspect-w-2 aspect-h-3 overflow-hidden rounded-lg">
                {tvShow.poster_path ? (
                  <Image
                    src={`https://www.themoviedb.org/t/p/w600_and_h900_bestv2${tvShow.poster_path}`}
                    alt={tvShow.name}
                    layout="fill"
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-gray-100" />
                )}
              </div>
            </div>

            <div className="mt-6 sm:mt-0 sm:ml-10">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl">
                {tvShow.name}{' '}
                <span className="font-extralight text-gray-200">
                  ({formatYear(tvShow.first_air_date)})
                </span>
              </h2>

              <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                  <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                  {formatShortDate(tvShow.first_air_date)}
                </div>

                <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                  <FilmIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                  {tvShow.genres?.map((genre) => genre.name).join(', ')}
                </div>

                {tvShow.episode_run_time ? (
                  <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                    <ClockIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                    {formatRuntime(tvShow.episode_run_time[0])}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center space-x-6">
                {tvShow.vote_average ? <Rating rating={tvShow.vote_average} /> : null}

                <button
                  type="button"
                  className="ml-6 inline-flex items-center rounded-md border border-transparent bg-fuchsia-100 py-2 pl-4 pr-5 text-sm font-medium text-fuchsia-700 shadow-sm hover:bg-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-fuchsia-700"
                  onClick={() =>
                    listModalDispatch({
                      type: 'SHOW_ADD_MODAL',
                      item: formatTvShow(tvShow),
                    })
                  }
                >
                  <PlusSmIcon className="mr-2 -ml-1 h-5 w-5" />
                  Add to list
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold italic text-gray-200">{tvShow.tagline}</h3>
              </div>

              <div className="mt-1">
                <p className="font-light leading-7 text-gray-200">{tvShow.overview}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Series cast</h3>
        </div>

        {credits?.cast ? (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
            <>
              {credits.cast.slice(0, 8).map((result) => (
                <li key={result.id} className="relative">
                  <ListItem
                    item={{
                      tmdbId: result.id ?? 0,
                      type: 'person',
                      title: result.name ?? 'Unknown name',
                      subTitle: result.character,
                      poster: result.profile_path ?? undefined,
                    }}
                    showType={false}
                    action="add"
                  />
                </li>
              ))}
            </>
          </ul>
        ) : null}
      </div>
    </DetailsLayout>
  );
};

export default TvShow;
