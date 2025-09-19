import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Event, Guest } from '../types';
import ViewEvent from './ViewEvent';
import PasswordPrompt from './PasswordPrompt';

interface ProtectedEventViewProps {
  events: Event[];
  addRsvp: (eventId: string, guest: Guest) => void;
}

const ProtectedEventView: React.FC<ProtectedEventViewProps> = ({ events, addRsvp }) => {
  const { eventId } = useParams<{ eventId: string }>();
  
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const sessionKey = `event-auth-${eventId}`;
  
  // Check session storage for prior authorization
  const isInitiallyAuthorized = () => {
      if (!event || !event.password) return true;
      try {
        return sessionStorage.getItem(sessionKey) === 'true';
      } catch (e) {
        console.error('Could not access session storage:', e);
        return false;
      }
  };

  const [isAuthorized, setIsAuthorized] = useState(isInitiallyAuthorized);
  
  // Effect to re-evaluate authorization if the event or its password changes
  useEffect(() => {
    setIsAuthorized(isInitiallyAuthorized());
  }, [event, eventId]);

  const handleCorrectPassword = () => {
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch(e) {
        console.error('Could not set item in session storage:', e);
    }
    setIsAuthorized(true);
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

  return <ViewEvent events={events} addRsvp={addRsvp} />;
};

export default ProtectedEventView;
