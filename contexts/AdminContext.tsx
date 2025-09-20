import React from 'react';
import type { Event } from '../types';
import { fetchAdminEvents } from '../lib/api';

const ADMIN_TOKEN_STORAGE_KEY = 'party-inviter-admin-token';

interface AdminContextValue {
  token: string | null;
  isAdmin: boolean;
  events: Event[];
  isLoadingEvents: boolean;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setToken: (token: string | null) => void;
  refreshEvents: () => Promise<void>;
  clearSession: () => void;
}

const AdminContext = React.createContext<AdminContextValue | undefined>(undefined);

const readInitialToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Unable to read admin token from storage:', error);
    return null;
  }
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = React.useState<string | null>(readInitialToken);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);

  const persistToken = React.useCallback((value: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (value) {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Unable to persist admin token:', error);
    }
  }, []);

  const setToken = React.useCallback(
    (value: string | null) => {
      setTokenState(value);
      persistToken(value);
    },
    [persistToken],
  );

  const clearSession = React.useCallback(() => {
    setToken(null);
    setEvents([]);
  }, [setToken]);

  const refreshEvents = React.useCallback(async () => {
    if (!token) {
      setEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    try {
      const fetched = await fetchAdminEvents(token);
      setEvents(fetched);
    } catch (error) {
      console.error('Unable to fetch events:', error);
      clearSession();
    } finally {
      setIsLoadingEvents(false);
    }
  }, [token, clearSession]);

  React.useEffect(() => {
    if (token) {
      refreshEvents();
    }
  }, [token, refreshEvents]);

  const contextValue = React.useMemo<AdminContextValue>(() => ({
    token,
    isAdmin: Boolean(token),
    events,
    setEvents,
    setToken,
    refreshEvents,
    isLoadingEvents,
    clearSession,
  }), [token, events, setToken, refreshEvents, isLoadingEvents, clearSession]);

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

export const useAdminContext = () => {
  const ctx = React.useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return ctx;
};
