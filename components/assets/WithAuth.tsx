import { useRouter } from 'next/router';

import Loading from './Loading';

import { useUserState } from '../../hooks/useUser';

// Types
type WithAuthProps = {
  restricted?: boolean;
};

// Component
const WithAuth: React.FC<WithAuthProps> = ({ restricted = true, children }) => {
  // Hooks
  const router = useRouter();
  const userState = useUserState();

  // Render
  if ((restricted && !userState.auth) || (!restricted && userState.auth)) {
    router.replace('/');
  }

  return <>{children}</>;
};

export default WithAuth;
