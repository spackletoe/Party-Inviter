import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import type { Event, Guest } from '../types';
import ViewEvent from './ViewEvent';
import PasswordPrompt from './PasswordPrompt';
import { isAdminAuthorized } from './ProtectedAdminRoute';

interface ProtectedEventViewProps {
  events: Event[];
  addRsvp: (eventId: string, guest: Guest) => void;
}

const ProtectedEventView: React.FC<ProtectedEventViewProps> = ({ events, addRsvp }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const sessionKey = `event-auth-${eventId}`;
  
  // Check session storage for prior authorization
  const isInitiallyAuthorized = () => {
    if (!event || !event.password) return true;
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      if (window.sessionStorage.getItem(sessionKey) === 'true') {
        return true;
      }
      const guestToken = searchParams.get('guest');
      const shareToken = event.shareToken ?? event.id;
      if (guestToken && shareToken && guestToken === shareToken) {
        window.sessionStorage.setItem(sessionKey, 'true');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Could not access session storage:', e);
      return false;
    }
  };

  const [isAuthorized, setIsAuthorized] = useState(isInitiallyAuthorized);

  const persistAuthorization = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (e) {
      console.error('Could not set item in session storage:', e);
    }
    setIsAuthorized(true);
  }, [sessionKey]);

  // Effect to re-evaluate authorization if the event or its password changes
  useEffect(() => {
    setIsAuthorized(isInitiallyAuthorized());
  }, [event, eventId]);

  useEffect(() => {
    if (!event) {
      return;
    }
    const guestToken = searchParams.get('guest');
    if (!guestToken) {
      return;
    }
    const shareToken = event.shareToken ?? event.id;
    if (guestToken && shareToken && guestToken === shareToken) {
      persistAuthorization();
    }
  }, [event, persistAuthorization, searchParams]);

  const handleCorrectPassword = () => {
    persistAuthorization();
  };

  if (!event) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold text-slate-700">Event Not Found</h2>
        <p className="text-slate-500 mt-2">The link may be incorrect. Please check with the host.</p>
        <Link to="/" className="mt-6 inline-block bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition">
          Create a New Event
        </Link>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <PasswordPrompt 
        eventName={event.title}
        correctPassword={event.password}
        onCorrectPassword={handleCorrectPassword}
      />
    );
  }

  const adminAuthorized = isAdminAuthorized();

  return <ViewEvent events={events} addRsvp={addRsvp} isAdmin={adminAuthorized} />;
};

export default ProtectedEventView;
