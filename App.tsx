import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import type { Event, Guest } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import CreateEvent from './components/CreateEvent';
import EditEvent from './components/EditEvent';
import ProtectedEventView from './components/ProtectedEventView';
import AccessGate from './components/AccessGate';
import ProtectedAdminRoute, { setAdminAuthorized } from './components/ProtectedAdminRoute';
import AdminDashboard from './components/AdminDashboard';

const generateShareToken = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 14);
};

const App: React.FC = () => {
  const [events, setEvents] = useLocalStorage<Event[]>('party-events', []);
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  React.useEffect(() => {
    if (events.length === 0) {
      return;
    }

    const needsToken = events.some(event => !event.shareToken);
    if (needsToken) {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.shareToken ? event : { ...event, shareToken: generateShareToken() }
        )
      );
    }
  }, [events, setEvents]);
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
          ? {
              ...event,
              guests: [
                ...event.guests,
                {
                  ...guest,
                  respondedAt: guest.respondedAt ?? new Date().toISOString(),
                },
              ],
            }
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
            <nav className="max-w-6xl mx-auto flex justify-center">
            <Link to="/" className="text-2xl align-center font-bold text-primary hover:text-primary-700 transition">
              Joe's Lame Party Invite Sender Thing
            </Link>
            </nav>
        </header>
        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <AccessGate
                  events={events}
                  adminPassword={adminPassword}
                  onAdminAuthorized={setAdminAuthorized}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard events={events} />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedAdminRoute>
                  <CreateEvent events={events} addEvent={addEvent} deleteEvent={deleteEvent} />
                </ProtectedAdminRoute>
              }
            />
            <Route path="/event/:eventId" element={<ProtectedEventView events={events} addRsvp={addRsvp} />} />
            <Route
              path="/event/:eventId/edit"
              element={
                <ProtectedAdminRoute>
                  <EditEvent events={events} editEvent={editEvent} />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </main>
        <footer className="text-center py-4 text-slate-500 text-sm">
          <p>copyright two-thousand twenty-five</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
