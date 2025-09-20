import React, { useState } from 'react';
import { LockClosedIcon } from './icons';

interface PasswordPromptProps {
  eventName: string;
  onSubmit: (password: string) => Promise<void>;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ eventName, onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) {
      setError('Please enter a password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(input);
    } catch (err) {
      console.error('Incorrect password provided:', err);
      setError(err instanceof Error ? err.message : 'Incorrect password. Please try again.');
      setInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8 mt-10">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8 text-center">
        <LockClosedIcon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">This event is private</h1>
        <p className="mt-2 text-slate-600">Please enter the password to view the invitation for "{eventName}".</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Enter password"
              required
              autoFocus
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
              aria-describedby="password-error"
            />
          </div>
          {error && <p id="password-error" className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300">
            {isSubmitting ? 'Unlocking…' : 'Unlock Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;
