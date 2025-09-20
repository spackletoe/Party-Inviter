import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import type { Event } from '../types';
import ViewEvent from './ViewEvent';
import PasswordPrompt from './PasswordPrompt';
import { authorizeEventAccess, fetchPublicEvent, submitRsvp, type RsvpPayload } from '../lib/api';
import { readGuestToken, storeGuestToken, storeManageToken, readManageToken } from '../lib/session';

interface ProtectedEventViewProps {
  adminEvents: Event[];
  isAdmin: boolean;
  onEventUpdated: (event: Event) => void;
}

const ProtectedEventView: React.FC<ProtectedEventViewProps> = ({ adminEvents, isAdmin, onEventUpdated }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const shareTokenFromQuery = searchParams.get('guest');

  const [event, setEvent] = useState<Event | null>(() => {
    if (isAdmin && eventId) {
      return adminEvents.find(evt => evt.id === eventId) ?? null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!event);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guestToken, setGuestTokenState] = useState<string | null>(() =>
    eventId ? readGuestToken(eventId) : null,
  );
  const [manageToken, setManageTokenState] = useState<string | null>(() =>
    eventId ? readManageToken(eventId) : null,
  );

  const shareToken = shareTokenFromQuery || event?.shareToken || '';

  const syncEvent = useCallback(
    (nextEvent: Event) => {
      setEvent(nextEvent);
      if (isAdmin) {
        onEventUpdated(nextEvent);
      }
    },
    [isAdmin, onEventUpdated],
  );

  useEffect(() => {
    if (!isAdmin || !eventId) {
      return;
    }

    const adminEvent = adminEvents.find(evt => evt.id === eventId);
    if (adminEvent) {
      setEvent(adminEvent);
      setIsLoading(false);
      setRequiresPassword(false);
      setLoadError(null);
    }
  }, [adminEvents, eventId, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    if (!shareToken) {
      setIsLoading(false);
      setEvent(null);
      setLoadError('This invitation link is missing a share token. Ask the host for a fresh link.');
      return;
    }

    let cancelled = false;
    const loadEvent = async () => {
      setIsLoading(true);
      try {
        const { event: fetchedEvent, requiresPassword: needsPassword } = await fetchPublicEvent(
          shareToken,
          guestToken,
        );

        if (cancelled) {
          return;
        }

        if (fetchedEvent) {
          syncEvent(fetchedEvent);
          setRequiresPassword(false);
          setLoadError(null);
        } else {
          setEvent(null);
          setRequiresPassword(needsPassword);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('Unable to load event details:', error);
        setEvent(null);
        setLoadError('We could not load this event right now. Please try again later.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [guestToken, isAdmin, shareToken, syncEvent]);

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (!shareToken) {
        throw new Error('Missing share token for this event.');
      }

      const { guestToken: grantedToken, eventId: authorizedEventId } = await authorizeEventAccess(
        shareToken,
        password,
      );

      const idToStore = authorizedEventId || eventId || (event ? event.id : null);
      if (idToStore) {
        storeGuestToken(idToStore, grantedToken);
      }
      setGuestTokenState(grantedToken);

      const { event: fetchedEvent } = await fetchPublicEvent(shareToken, grantedToken);
      if (fetchedEvent) {
        syncEvent(fetchedEvent);
        setRequiresPassword(false);
        setLoadError(null);
      }
    },
    [event, eventId, shareToken, syncEvent],
  );

  const handleRsvpSubmit = useCallback(
    async (payload: RsvpPayload) => {
      if (!shareToken) {
        throw new Error('Missing share token for this event.');
      }

      const response = await submitRsvp(shareToken, payload, guestToken, manageToken);
      syncEvent(response.event);

      const idToStore = eventId || response.event.id;
      if (response.guestToken && idToStore) {
        storeGuestToken(idToStore, response.guestToken);
        setGuestTokenState(response.guestToken);
      }

      if (response.manageToken && idToStore) {
        storeManageToken(idToStore, response.manageToken);
        setManageTokenState(response.manageToken);
      }

      return response.guest;
    },
    [eventId, guestToken, manageToken, shareToken, syncEvent],
  );

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="text-center p-10">
          <p className="text-slate-500">Loading event details…</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="text-center p-10 space-y-4">
          <h2 className="text-2xl font-bold text-slate-700">Something went wrong</h2>
          <p className="text-slate-500">{loadError}</p>
          <Link
            to="/"
            className="inline-block bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition"
          >
            Back to start
          </Link>
        </div>
      );
    }

    if (!event) {
      return (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold text-slate-700">Event Not Found</h2>
          <p className="text-slate-500 mt-2">The link may be incorrect. Please check with the host.</p>
          <Link
            to="/"
            className="mt-6 inline-block bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition"
          >
            Create a New Event
          </Link>
        </div>
      );
    }

    if (!isAdmin && event.passwordProtected && requiresPassword) {
      return <PasswordPrompt eventName={event.title} onSubmit={handlePasswordSubmit} />;
    }

    return (
      <ViewEvent
        event={event}
        onSubmitRsvp={handleRsvpSubmit}
        isAdmin={isAdmin}
        shareToken={shareToken}
      />
    );
  }, [event, handlePasswordSubmit, handleRsvpSubmit, isAdmin, isLoading, loadError, requiresPassword, shareToken]);

  return content;
};

export default ProtectedEventView;
