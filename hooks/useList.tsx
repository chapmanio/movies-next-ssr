import { createContext, useReducer, useContext } from 'react';

import type { List, ListItem } from '../lib/api/types';

// Types
type ListAction =
  | { type: 'SET_LISTS'; lists: List[] }
  | { type: 'ADD_LIST'; list: List }
  | { type: 'UPDATE_LIST'; id: string; list: List }
  | { type: 'REMOVE_LIST'; id: string }
  | { type: 'ADD_LIST_ITEM'; id: string; item: ListItem }
  | { type: 'REMOVE_LIST_ITEM'; id: string; itemId: string }
  | { type: 'SET_SELECTED_LIST'; id: string }
  | { type: 'CLEAR_SELECTED_LIST' };

type ListState = { lists: List[] | undefined; selectedId?: string };
type ListDispatch = (action: ListAction) => void;

// Context
const ListStateContext = createContext<ListState | undefined>(undefined);
const ListDispatchContext = createContext<ListDispatch | undefined>(undefined);

// Reducer
const listReducer = (state: ListState, action: ListAction): ListState => {
  switch (action.type) {
    case 'SET_LISTS': {
      return {
        ...state,
        lists: action.lists,
      };
    }
    case 'ADD_LIST': {
      const currentLists = state.lists ?? [];
      const newLists = [...currentLists, action.list].sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...state,
        lists: newLists,
      };
    }
    case 'UPDATE_LIST': {
      if (!state.lists) {
        throw new Error(`No user lists found`);
      }

      const updatedLists = state.lists.map((list) => {
        if (list.id === action.id) {
          return action.list;
        }

        return list;
      });

      return {
        ...state,
        lists: updatedLists,
      };
    }
    case 'REMOVE_LIST': {
      if (!state.lists) {
        throw new Error(`No user lists found`);
      }

      const newLists = state.lists.filter((list) => list.id !== action.id);

      return {
        ...state,
        lists: newLists,
      };
    }
    case 'ADD_LIST_ITEM': {
      if (!state.lists) {
        throw new Error(`No user lists found`);
      }

      const updatedLists = state.lists.map((list) => {
        if (list.id === action.id) {
          const currentItems = list.items || [];
          const updatedItems = [...currentItems, action.item].sort((a, b) =>
            a.title.localeCompare(b.title)
          );

          return {
            ...list,
            items: updatedItems,
          };
        }

        return list;
      });

      return {
        ...state,
        lists: updatedLists,
      };
    }
    case 'REMOVE_LIST_ITEM': {
      if (!state.lists) {
        throw new Error(`No user lists found`);
      }

      const updatedLists = state.lists.map((list) => {
        if (list.id === action.id) {
          const currentItems = list.items || [];
          const updatedItems = currentItems.filter((item) => item.id !== action.itemId);

          return {
            ...list,
            items: updatedItems,
          };
        }

        return list;
      });

      return {
        ...state,
        lists: updatedLists,
      };
    }
    case 'SET_SELECTED_LIST': {
      return {
        ...state,
        selectedId: action.id,
      };
    }
    case 'CLEAR_SELECTED_LIST': {
      return {
        ...state,
        selectedId: undefined,
      };
    }
    default:
      throw new Error(`Unhandled action type`);
  }
};

// Provider
const ListProvider: React.FC<{ initialState: ListState }> = ({ children, initialState }) => {
  // Reducer
  const [state, dispatch] = useReducer(listReducer, initialState);

  // Render
  return (
    <ListStateContext.Provider value={state}>
      <ListDispatchContext.Provider value={dispatch}>{children}</ListDispatchContext.Provider>
    </ListStateContext.Provider>
  );
};

// Hook
const useListState = () => {
  const state = useContext(ListStateContext);

  if (typeof state === 'undefined') {
    throw new Error('useListState must be used within a ListStateContext');
  }

  return state;
};

const useListDispatch = () => {
  const dispatch = useContext(ListDispatchContext);

  if (typeof dispatch === 'undefined') {
    throw new Error('useListDispatch must be used within a ListDispatchContext');
  }

  return dispatch;
};

export { ListProvider, useListState, useListDispatch };
