import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { CalendarIcon, UsersIcon, PencilIcon, ClipboardIcon, CheckCircleIcon, LockClosedIcon, TrashIcon } from './icons';

interface EventListProps {
  events: Event[];
  onDelete: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({ events, onDelete }) => {
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const resetCopyRef = useRef<number | null>(null);

  const sortedEvents = useMemo(() => [...events].reverse(), [events]);

  useEffect(() => () => {
    if (resetCopyRef.current) {
      window.clearTimeout(resetCopyRef.current);
    }
  }, []);

  const formatDateRange = (event: Event) => {
    const start = new Date(event.date);
    const end = event.endDate ? new Date(event.endDate) : null;
    if (!end) {
      return start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    }

    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      return `${start.toLocaleDateString('en-US', { dateStyle: 'medium' })}, ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return `${start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} -> ${end.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`;
  };

  const handleCopyLink = async (eventId: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareUrl = `${window.location.origin}/#/event/${eventId}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Clipboard API not available');
      }
      setCopiedEventId(eventId);
    } catch (error) {
      console.error('Failed to copy link', error);
      window.prompt('Copy this invitation link:', shareUrl);
      setCopiedEventId(eventId);
    }

    if (resetCopyRef.current) {
      window.clearTimeout(resetCopyRef.current);
    }

    resetCopyRef.current = window.setTimeout(() => {
      setCopiedEventId(null);
      resetCopyRef.current = null;
    }, 2000);
  };

  const handleDelete = (eventId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this event? Guests will lose the invitation link.');
      if (!confirmed) {
        return;
      }
    }
    onDelete(eventId);
  };

  const totalEventsLabel = `${events.length} invitation${events.length === 1 ? '' : 's'}`;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Invitations</h2>
          <p className="text-sm text-slate-500">Quickly jump back into events you've already created.</p>
        </div>
        <span className="text-sm text-slate-500">{totalEventsLabel}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedEvents.map(event => {
          const attendingGuests = event.guests.filter(guest => guest.status === 'attending');
          const totalGuests = attendingGuests.reduce((sum, guest) => sum + 1 + guest.plusOnes, 0);
          const viewerUrl = `/event/${event.id}`;
          const copied = copiedEventId === event.id;

          return (
            <article key={event.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 leading-tight">{event.title}</h3>
                    <p className="text-sm text-slate-500">Hosted by {event.host}</p>
                  </div>
                  {event.password && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-semibold">
                      <LockClosedIcon className="h-4 w-4" /> Private
                    </span>
                  )}
                </header>

                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <span>{formatDateRange(event)}</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <UsersIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">{totalGuests} attending</p>
                    <p className="text-xs text-slate-500">{event.showGuestList ? 'Guest list visible to everyone' : 'Guest list hidden from attendees'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link to={viewerUrl} className="flex items-center justify-center gap-2 rounded-lg border border-primary text-primary font-semibold py-2 hover:bg-primary/10 transition">
                  View Event
                </Link>
                <Link to={`${viewerUrl}/edit`} className="flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold py-2 hover:bg-primary-700 transition">
                  <PencilIcon className="h-4 w-4" /> Edit
                </Link>
                <button type="button" onClick={() => handleCopyLink(event.id)} className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 text-slate-700 font-semibold py-2 hover:bg-slate-200 transition">
                  {copied ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4" /> Share Link
                    </>
                  )}
                </button>
                <button type="button" onClick={() => handleDelete(event.id)} className="flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-600 font-semibold py-2 hover:bg-red-100 transition">
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default EventList;
