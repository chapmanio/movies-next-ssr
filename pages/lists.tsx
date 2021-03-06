import { useCallback, useEffect, useRef, useState } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import Head from 'next/head';

import DetailsLayout from '../components/layouts/Details';
import Alert from '../components/assets/Alert';
import List from '../components/lists/List';
import Notification, { NotificationProps } from '../components/assets/Notification';

import { useListState, useListDispatch } from '../hooks/useList';

import { addList, deleteList, getAllLists, updateList } from '../lib/api/lists';
import type { List as ListType } from '../lib/api/types';
import type { ApiError } from '../lib/api';
import { authUser, AuthUser } from '../lib/api/auth';

// Types
type Confirm = Omit<NotificationProps, 'onClose'>;

type ServerSideResponse = {
  user: AuthUser;
  lists: ListType[];
};

// SSR
export const getServerSideProps: GetServerSideProps<ServerSideResponse> = async ({ req }) => {
  // Current user
  let user: AuthUser;

  try {
    user = await authUser({ cookie: req.headers.cookie ?? '' });
  } catch (error) {
    user = { auth: false };
  }

  // Bounce if not logged in
  if (!user.auth) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Lists
  let lists: ListType[];

  try {
    lists = await getAllLists({ cookie: req.headers.cookie ?? '' });
  } catch (error) {
    lists = [];
  }

  return {
    props: {
      user,
      lists,
    },
  };
};

// Component
const Lists: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  // Hooks
  const listState = useListState();
  const listDispatch = useListDispatch();

  // Local state
  const [lists, setLists] = useState<ListType[]>(props.lists);

  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>({
    type: 'success',
    title: '',
    visible: false,
  });
  const [error, setError] = useState<string | undefined>(undefined);

  // Refs
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Callbacks
  const actionComplete = useCallback((message: string) => {
    // Scroll to the top
    if (titleRef.current) {
      titleRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Clear the form
    setSlug(undefined);
    setName('');
    setSubmitLoading(false);

    // Show the notification
    setConfirm((confirm) => ({
      ...confirm,
      visible: true,
      title: message,
    }));
  }, []);

  // Effects
  useEffect(() => {
    // Set the global state initially
    if (!listState.lists) {
      listDispatch({ type: 'SET_LISTS', lists });
    }
  }, [lists, listState.lists, listDispatch]);

  useEffect(() => {
    // Update from global state
    if (listState.lists) {
      setLists(listState.lists);
    }
  }, [listState.lists]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim() !== '') {
      setError(undefined);
      setSubmitLoading(true);

      if (slug) {
        updateList({ slug, name })
          .then((list) => {
            // Update list
            listDispatch({ type: 'UPDATE_LIST', slug: list.slug, list });

            // Clear form and confirm
            actionComplete('List updated');
          })
          .catch((error: ApiError) => {
            setSubmitLoading(false);
            setError(error.message);
          });
      } else {
        addList(name)
          .then((list) => {
            // Add to lists
            listDispatch({ type: 'ADD_LIST', list });

            // Clear form and confirm
            actionComplete('List added');
          })
          .catch((error: ApiError) => {
            setSubmitLoading(false);
            setError(error.message);
          });
      }
    }
  };

  const handleCancel = () => {
    setSlug(undefined);
    setName('');
  };

  const handleEdit = (list: ListType) => {
    if (titleRef.current) {
      titleRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    setSlug(list.slug);
    setName(list.name);
  };

  const handleDelete = (list: ListType) => {
    // TODO: Confirmation first?

    deleteList(list.slug)
      .then(() => {
        // Remove list
        listDispatch({ type: 'REMOVE_LIST', slug: list.slug });

        // Clear and confirm
        actionComplete('List removed');
      })
      .catch((error: ApiError) => {
        setError(error.message);
      });
  };

  // Render
  return (
    <DetailsLayout>
      <Head>
        <title>My lists</title>
      </Head>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900" ref={titleRef}>
          My lists
        </h2>

        {error ? (
          <div className="mt-5">
            <Alert type="error" message={error} onClose={() => setError(undefined)} />
          </div>
        ) : null}

        <form className="mt-5 sm:flex sm:items-center" onSubmit={handleSubmit}>
          <div className="w-full sm:max-w-xs">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="List name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={
              `mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm` +
              (submitLoading ? ` opacity-75` : ` hover:bg-indigo-700`)
            }
            disabled={submitLoading}
          >
            {submitLoading ? `Please wait...` : slug ? `Edit list` : `Create list`}
          </button>

          {slug ? (
            <button
              type="button"
              className={
                `mt-3 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm` +
                (submitLoading ? ` opacity-75` : ` hover:bg-gray-50`)
              }
              disabled={submitLoading}
              onClick={handleCancel}
            >
              Cancel
            </button>
          ) : null}
        </form>

        {lists.map((list) => (
          <div key={list.id} className="mt-10">
            <List list={list} onEdit={() => handleEdit(list)} onDelete={() => handleDelete(list)} />
          </div>
        ))}
      </div>

      <Notification
        {...confirm}
        onClose={() => setConfirm((confirm) => ({ ...confirm, visible: false }))}
      />
    </DetailsLayout>
  );
};

export default Lists;
