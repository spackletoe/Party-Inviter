import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import type { Event, Guest } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import CreateEvent from './components/CreateEvent';
import EditEvent from './components/EditEvent';
import ProtectedEventView from './components/ProtectedEventView';

const App: React.FC = () => {
  const [events, setEvents] = useLocalStorage<Event[]>('party-events', []);

  const addEvent = (event: Event) => {
    setEvents(prevEvents => [...prevEvents, event]);
  };

  const editEvent = (updatedEvent: Event) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const addRsvp = (eventId: string, guest: Guest) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, guests: [...event.guests, guest] }
          : event
      )
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(`event-auth-${eventId}`);
      } catch (error) {
        console.error('Failed to clear session storage for event:', error);
      }
    }
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <header className="p-4 bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200">
          <nav className="max-w-6xl mx-auto">
            <Link to="/" className="text-2xl align-center font-bold text-primary hover:text-primary-700 transition">
              Joe's Lame Party Planner
            </Link>
          </nav>
        </header>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<CreateEvent events={events} addEvent={addEvent} deleteEvent={deleteEvent} />} />
            <Route path="/event/:eventId" element={<ProtectedEventView events={events} addRsvp={addRsvp} />} />
            <Route path="/event/:eventId/edit" element={<EditEvent events={events} editEvent={editEvent} />} />
          </Routes>
        </main>
        <footer className="text-center py-4 text-slate-500 text-sm">
          <p>Created with ???,? by a world-class React engineer.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
