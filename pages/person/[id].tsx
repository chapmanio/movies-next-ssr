import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import type { Person as PersonResponse } from 'moviedb-promise/dist/request-types';
import { LocationMarkerIcon, PlusSmIcon, UserIcon } from '@heroicons/react/solid';
import { CakeIcon } from '@heroicons/react/outline';

import DetailsLayout from '../../components/layouts/Details';
import ListItem from '../../components/lists/ListItem';

import { useListModalDispatch } from '../../hooks/useListModal';

import { formatAge } from '../../lib/dates';
import { getPerson, getPersonCredits } from '../../lib/api/person';
import { formatPerson, formatPersonCredits, ListItem as ListItemType } from '../../lib/format';
import { AuthUser, authUser } from '../../lib/api/auth';

// Types
type ServerSideResponse = {
  user: AuthUser;
  person: PersonResponse;
  credits?: ListItemType[];
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

  const personId = parseInt(query.id.toString());

  // Get the movie
  let person: PersonResponse;

  try {
    person = await getPerson({ id: personId });
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (!person.id) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Get the credits
  let credits: ListItemType[] | undefined;

  try {
    const dbCredits = await getPersonCredits({ id: personId });

    credits = formatPersonCredits(dbCredits);
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
      person,
      credits,
    },
  };
};

// Component
const Person: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  person,
  credits,
}) => {
  // Hooks
  const listModalDispatch = useListModalDispatch();

  // Local state
  const [showMore, setShowMore] = useState(false);

  // Render
  return (
    <DetailsLayout>
      <Head>
        <title>{person.name} • Movies</title>
      </Head>

      <div className="bg-theme-person">
        <div className="mx-auto max-w-7xl items-center px-4 py-8 sm:flex sm:px-6 lg:px-8">
          <div className="flex-none self-start sm:w-[300px]">
            <div className="aspect-w-2 aspect-h-3 overflow-hidden rounded-lg">
              {person.profile_path ? (
                <Image
                  src={`https://www.themoviedb.org/t/p/w600_and_h900_bestv2${person.profile_path}`}
                  alt={person.name}
                  layout="fill"
                  className="object-cover"
                />
              ) : (
                <div className="bg-gray-100" />
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-0 sm:ml-10">
            <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl">{person.name}</h2>

            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                <UserIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                {person.gender === 1 ? `Female` : person.gender === 2 ? `Male` : `Unknown`}
              </div>

              <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                <CakeIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                {person.birthday ? (
                  <>
                    {person.deathday ? `Died ` : null}
                    {formatAge(person.birthday, person.deathday)} years old
                  </>
                ) : (
                  `Unknown birthday`
                )}
              </div>

              <div className="mt-2 flex items-center text-sm font-light text-gray-200">
                <LocationMarkerIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                {person.place_of_birth ? <>{person.place_of_birth}</> : `Unknown birthplace`}
              </div>
            </div>

            <div className="mt-6">
              <button
                className="inline-flex items-center rounded-md border border-transparent bg-green-100 py-2 pl-4 pr-5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-green-700"
                onClick={() =>
                  listModalDispatch({
                    type: 'SHOW_ADD_MODAL',
                    item: formatPerson(person),
                  })
                }
              >
                <PlusSmIcon className="mr-2 -ml-1 h-5 w-5" />
                Add to list
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold italic text-gray-200">Biography</h3>
              {person.biography ? (
                <>
                  {person.biography.length > 400 ? (
                    <>
                      <p className="mt-1 font-light leading-7 text-gray-200">
                        {showMore ? person.biography : `${person.biography.substring(0, 400)}...`}
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowMore(!showMore)}
                        className="mt-2 font-semibold text-gray-200"
                      >
                        {showMore ? `Read less` : `Read more`}
                      </button>
                    </>
                  ) : (
                    <p className="mt-1 font-light leading-7 text-gray-200">{person.biography}</p>
                  )}
                </>
              ) : (
                <p className="mt-1 font-light leading-7 text-gray-200">No biography found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Latest roles</h3>
        </div>

        {credits ? (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
            {credits.slice(0, 8).map((result) => (
              <li key={result.tmdbId} className="relative">
                <ListItem item={result} action="add" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DetailsLayout>
  );
};

export default Person;
