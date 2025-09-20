import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from './icons';
import type { AccessResult } from '../lib/api';
import { storeGuestToken } from '../lib/session';

interface AccessGateProps {
  submitAccessPassword: (password: string) => Promise<AccessResult>;
  onAdminAuthorized: (token: string) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ submitAccessPassword, onAdminAuthorized }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Please enter a password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await submitAccessPassword(trimmedPassword);

      if (result.type === 'admin') {
        onAdminAuthorized(result.token);
        navigate('/admin');
        return;
      }

      if (result.guestToken) {
        storeGuestToken(result.eventId, result.guestToken);
      }

      const params = new URLSearchParams();
      params.set('guest', result.shareToken);
      navigate(`/event/${result.eventId}?${params.toString()}`);
    } catch (err) {
      console.error('Unable to authorize password:', err);
      setError(err instanceof Error ? err.message : 'That password did not match anything we know about.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessGate;
