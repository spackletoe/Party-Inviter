import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { LockClosedIcon } from './icons';

interface AccessGateProps {
  events: Event[];
  adminPassword: string;
  onAdminAuthorized: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ events, adminPassword, onAdminAuthorized }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Please enter a password.');
      return;
    }

    if (trimmedPassword === adminPassword) {
      setError('');
      onAdminAuthorized();
      navigate('/admin');
      return;
    }

    const matchingEvent = events.find(evt => evt.password && evt.password === trimmedPassword);
    if (matchingEvent) {
      setError('');
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(`event-auth-${matchingEvent.id}`, 'true');
        }
      } catch (storageError) {
        console.error('Unable to persist event session state:', storageError);
      }
      navigate(`/event/${matchingEvent.id}`);
      return;
    }

    setError('No event or admin area matched that password. Please try again.');
    setPassword('');
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8 mt-16">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8 text-center">
        <LockClosedIcon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Welcome!</h1>
        <p className="mt-2 text-slate-600">
          Enter the event password to view an invitation or use the admin password to manage events.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="access-password" className="sr-only">
              Password
            </label>
            <input
              id="access-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessGate;
