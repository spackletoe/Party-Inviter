import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AdminProvider, useAdminContext } from './contexts/AdminContext';
import AccessGate from './components/AccessGate';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminDashboard from './components/AdminDashboard';
import CreateEvent from './components/CreateEvent';
import EditEvent from './components/EditEvent';
import ProtectedEventView from './components/ProtectedEventView';
import type { Event } from './types';
import {
  submitAccessPassword,
  createEvent as createEventRequest,
  updateEvent as updateEventRequest,
  deleteEvent as deleteEventRequest,
  type EventPayload,
} from './lib/api';

const App: React.FC = () => (
  <AdminProvider>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </AdminProvider>
);

const updateEventList = (events: Event[], updatedEvent: Event) => {
  const exists = events.some(event => event.id === updatedEvent.id);
  if (exists) {
    return events.map(event => (event.id === updatedEvent.id ? updatedEvent : event));
  }
  return [...events, updatedEvent];
};

const AppContent: React.FC = () => {
  const { token: adminToken, isAdmin, events, setEvents, setToken, refreshEvents, clearSession } = useAdminContext();

  const handleAdminAuthorized = React.useCallback(
    (token: string) => {
      setToken(token);
      void refreshEvents();
    },
    [setToken, refreshEvents],
  );

  const handleEventCreated = React.useCallback(
    async (payload: EventPayload) => {
      if (!adminToken) {
        throw new Error('Admin session expired. Please sign in again.');
      }
      const newEvent = await createEventRequest(adminToken, payload);
      setEvents(prevEvents => [...prevEvents, newEvent]);
      return newEvent;
    },
    [adminToken, setEvents],
  );

  const handleEventUpdated = React.useCallback(
    async (eventId: string, payload: EventPayload) => {
      if (!adminToken) {
        throw new Error('Admin session expired. Please sign in again.');
      }
      const updatedEvent = await updateEventRequest(adminToken, eventId, payload);
      setEvents(prevEvents => updateEventList(prevEvents, updatedEvent));
      return updatedEvent;
    },
    [adminToken, setEvents],
  );

  const handleEventDeleted = React.useCallback(
    async (eventId: string) => {
      if (!adminToken) {
        throw new Error('Admin session expired. Please sign in again.');
      }
      await deleteEventRequest(adminToken, eventId);
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    },
    [adminToken, setEvents],
  );

  const handleAdminLogout = React.useCallback(() => {
    clearSession();
  }, [clearSession]);

  const handleEventSynced = React.useCallback(
    (event: Event) => {
      setEvents(prevEvents => updateEventList(prevEvents, event));
    },
    [setEvents],
  );

  return (
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
                onAdminAuthorized={handleAdminAuthorized}
                submitAccessPassword={submitAccessPassword}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard onLogout={handleAdminLogout} />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedAdminRoute>
                <CreateEvent
                  events={events}
                  onCreate={handleEventCreated}
                  onDelete={handleEventDeleted}
                />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/event/:eventId"
            element={
              <ProtectedEventView
                adminEvents={events}
                isAdmin={isAdmin}
                onEventUpdated={handleEventSynced}
              />
            }
          />
          <Route
            path="/event/:eventId/edit"
            element={
              <ProtectedAdminRoute>
                <EditEvent events={events} onSave={handleEventUpdated} />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>copyright two-thousand twenty-five</p>
      </footer>
    </div>
  );
};

export default App;
