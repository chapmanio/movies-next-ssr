import { createContext, useReducer, useContext } from 'react';

import { AuthUser } from '../lib/api/auth';

// Types
type UserAction = { type: 'SET_USER'; user: AuthUser } | { type: 'CLEAR_USER' };

type UserState = AuthUser;
type UserDispatch = (action: UserAction) => void;

// Context
const UserStateContext = createContext<UserState | undefined>(undefined);
const UserDispatchContext = createContext<UserDispatch | undefined>(undefined);

// Reducer
const authReducer = (_state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER': {
      return action.user;
    }
    case 'CLEAR_USER': {
      return { auth: false };
    }
    default:
      throw new Error(`Unhandled action type`);
  }
};

// Provider
const UserProvider: React.FC<{ initialState: UserState }> = ({ children, initialState }) => {
  // Reducer
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Render
  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>{children}</UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
};

// Hook
const useUserState = () => {
  const state = useContext(UserStateContext);

  if (typeof state === 'undefined') {
    throw new Error('useUserState must be used within a UserStateContext');
  }

  return state;
};

const useUserDispatch = () => {
  const dispatch = useContext(UserDispatchContext);

  if (typeof dispatch === 'undefined') {
    throw new Error('useUserDispatch must be used within a UserDispatchContext');
  }

  return dispatch;
};

export { UserProvider, useUserState, useUserDispatch };
