import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Event, Guest } from '../types';
import { CalendarIcon, LocationIcon, UserIcon, UsersIcon, ClipboardIcon, CheckCircleIcon, PencilIcon } from './icons';

interface ViewEventProps {
  events: Event[];
  addRsvp: (eventId: string, guest: Guest) => void;
}

const ViewEvent: React.FC<ViewEventProps> = ({ events, addRsvp }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [name, setName] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rsvpChoice, setRsvpChoice] = useState<'yes' | 'no' | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (rsvpChoice !== 'yes') {
      setPlusOnes(0);
      setEmail('');
    }
    if (rsvpChoice === null) {
      setComment('');
      setName('');
    }
  }, [rsvpChoice]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please enter your name.');
      return;
    }

    if (event && rsvpChoice) {
      const newGuest: Guest = {
        id: Math.random().toString(36).substring(2, 10),
        name,
        plusOnes: rsvpChoice === 'yes' ? Math.max(0, plusOnes) : 0,
        comment,
        email: rsvpChoice === 'yes' && email ? email : undefined,
        status: rsvpChoice === 'yes' ? 'attending' : 'not-attending',
      };
      addRsvp(event.id, newGuest);
      setSubmitted(true);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareUrl = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Clipboard API not available');
      }
      setLinkCopied(true);
    } catch (error) {
      console.error('Failed to copy link', error);
      window.prompt('Copy this invitation link:', shareUrl);
      setLinkCopied(true);
    }

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setLinkCopied(false);
      copyTimeoutRef.current = null;
    }, 2000);
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

  const attendingGuests = event.guests.filter(g => g.status === 'attending');
  const totalGuests = attendingGuests.reduce((sum, guest) => sum + 1 + guest.plusOnes, 0);

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

  const formattedStartDate = formatDateTime(event.date);
  const formattedEndDate = event.endDate ? formatDateTime(event.endDate) : null;
  const sameDay = event.endDate && new Date(event.date).toDateString() === new Date(event.endDate).toDateString();

  return (
    <>
    <style>{`
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { margin-top: 1.2em; margin-bottom: 0.5em; font-weight: 600; color: #1e293b; }
        .prose h1 { font-size: 1.875rem; }
        .prose h2 { font-size: 1.5rem; }
        .prose h3 { font-size: 1.25rem; }
        .prose p { margin-bottom: 1em; color: #475569; }
        .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; color: #475569;}
        .prose ul { list-style-type: disc; }
        .prose ol { list-style-type: decimal; }
        .prose a { color: #4f46e5; text-decoration: underline; }
        .prose strong { font-weight: 600; color: #334155; }
        .prose blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; margin-left: 0; font-style: italic; color: #64748b;}
        .prose code { background-color: #f1f5f9; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .prose pre { background-color: #f1f5f9; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
    `}</style>
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Event Details */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8">
            <div className="mb-6">
                <p className="text-base font-semibold text-primary uppercase tracking-wide">You're Invited</p>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mt-2">{event.title}</h1>
                <p className="mt-4 text-xl text-slate-600">Hosted by {event.host}</p>
            </div>
            
            <div className="space-y-4 text-slate-700 border-t border-slate-200 pt-6">
                <div className="flex items-start">
                    <CalendarIcon className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                    <span className="text-lg">
                      {formattedEndDate
                        ? sameDay
                          ? `${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${formatTime(event.date)} - ${formatTime(event.endDate)}`
                          : `From ${formattedStartDate} to ${formattedEndDate}`
                        : formattedStartDate}
                    </span>
                </div>
                <div className="flex items-start">
                    <LocationIcon className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                    <span className="text-lg">{event.location}</span>
                </div>
            </div>

            {event.message && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                    <div className="prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.message}</ReactMarkdown>
                    </div>
                </div>
            )}
             <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-4">
                <Link to={`/event/${event.id}/edit`} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300">
                    <PencilIcon className="h-5 w-5" /> Edit Event
                </Link>
                <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-300">
                    {linkCopied ? <><CheckCircleIcon className="h-5 w-5 text-green-500" /> Link Copied!</> : <><ClipboardIcon className="h-5 w-5" /> Copy Shareable Link</>}
                </button>
             </div>
          </div>
        </div>

        {/* Right Column: RSVP & Guests */}
        <div className="lg:col-span-2 space-y-8">
          {/* RSVP Form */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Are you coming?</h2>
            {submitted ? (
                <div className="text-center bg-green-50 p-6 rounded-lg">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="mt-4 font-semibold text-green-800 text-lg">Thanks for your RSVP!</p>
                    <p className="text-green-700">We've saved your response.</p>
                </div>
            ) : rsvpChoice ? (
              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                {rsvpChoice === 'yes' ? (
                  <>
                    <div>
                      <label htmlFor="name" className="text-sm font-semibold text-slate-700">Your Name</label>
                      <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                    <div>
                      <label htmlFor="plusOnes" className="text-sm font-semibold text-slate-700">Guests you're bringing</label>
                      <input id="plusOnes" type="number" value={plusOnes} onChange={(e) => {
                        const parsed = Number(e.target.value);
                        setPlusOnes(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }} min="0" className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email (Optional)</label>
                      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="For event updates" className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                    <div>
                      <label htmlFor="comment" className="text-sm font-semibold text-slate-700">Comment (Optional)</label>
                      <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"></textarea>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-4">Sorry you can't make it. Thanks for letting the host know!</p>
                    <div>
                      <label htmlFor="name" className="text-sm font-semibold text-slate-700">Your Name</label>
                      <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                    <div>
                      <label htmlFor="comment" className="text-sm font-semibold text-slate-700">Reason (Optional)</label>
                      <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Let the host know why you can't attend." className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"></textarea>
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300">
                  Submit RSVP
                </button>
                <button type="button" onClick={() => setRsvpChoice(null)} className="w-full text-center text-sm text-slate-500 hover:text-primary mt-2">
                  Change response
                </button>
              </form>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setRsvpChoice('yes')} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300">
                    Yes, I'm coming
                    </button>
                    <button onClick={() => setRsvpChoice('no')} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-300">
                    No, can't make it
                    </button>
                </div>
            )}
          </div>

          {/* Guest List */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8">
            <div className="flex items-center gap-3 mb-4">
                <UsersIcon className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-bold text-slate-800">
                    {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} Attending
                </h2>
            </div>
            {event.showGuestList ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {attendingGuests.length > 0 ? attendingGuests.map(guest => (
                  <li key={guest.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-slate-400" />
                        {guest.name} {guest.plusOnes > 0 && <span className="text-xs font-normal bg-primary-100 text-primary-800 rounded-full px-2 py-0.5">+{guest.plusOnes}</span>}
                    </div>
                    {guest.comment && <p className="text-sm text-slate-500 italic mt-1 ml-7">"{guest.comment}"</p>}
                  </li>
                )) : <p className="text-slate-500">Be the first to RSVP!</p>}
              </ul>
            ) : <p className="text-slate-500">The host has chosen to keep the guest list private.</p>}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ViewEvent;
