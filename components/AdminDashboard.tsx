import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import {
  CalendarIcon,
  LockClosedIcon,
  PencilIcon,
  PlusIcon,
  ArrowRightIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from './icons';

interface AdminDashboardProps {
  events: Event[];
}

const formatDateRange = (event: Event) => {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) {
    return 'Date not set';
  }

  const end = event.endDate ? new Date(event.endDate) : null;
  if (!end || Number.isNaN(end.getTime())) {
    return start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleDateString('en-US', { dateStyle: 'medium' })}, ${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return `${start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} → ${end.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ events }) => {
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: Event[] = [];
    const past: Event[] = [];

    events.forEach(event => {
      const endReference = event.endDate ? new Date(event.endDate) : new Date(event.date);
      if (!Number.isNaN(endReference.getTime()) && endReference < now) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  const recentResponses = useMemo(() => {
    return events
      .flatMap(event =>
        event.guests.map(guest => ({
          eventId: event.id,
          eventTitle: event.title,
          guest,
          respondedAt: guest.respondedAt ? new Date(guest.respondedAt).getTime() : 0,
        }))
      )
      .sort((a, b) => b.respondedAt - a.respondedAt)
      .slice(0, 6);
  }, [events]);

  const renderEventCard = (event: Event) => {
    const attendingGuests = event.guests.filter(guest => guest.status === 'attending');
    const totalGuests = attendingGuests.reduce((sum, guest) => sum + 1 + guest.plusOnes, 0);
    const viewerUrl = `/event/${event.id}`;

    return (
      <article
        key={event.id}
        className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-6 flex flex-col justify-between border border-slate-100"
      >
        <div className="space-y-4">
          <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 leading-tight">{event.title}</h3>
                <p className="text-sm text-slate-500">Hosted by {event.host}</p>
              </div>
              {event.password && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-semibold">
                  <LockClosedIcon className="h-4 w-4" /> Private
                </span>
              )}
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
              <span>{formatDateRange(event)}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <UsersIcon className="h-5 w-5 text-primary mt-0.5" />
              <span>{totalGuests} attending</span>
            </div>
          </header>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            to={viewerUrl}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary text-primary font-semibold py-2 hover:bg-primary/10 transition"
          >
            View Event <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to={`${viewerUrl}/edit`}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold py-2 hover:bg-primary-700 transition"
          >
            <PencilIcon className="h-4 w-4" /> Edit Event
          </Link>
        </div>
      </article>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      <section className="bg-white rounded-2xl shadow-2xl shadow-slate-200 p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">
              Manage invitations, review upcoming celebrations, and revisit past events all from one place.
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold py-3 px-5 hover:bg-primary-700 transition"
          >
            <PlusIcon className="h-5 w-5" /> Create a New Event
          </Link>
        </div>
      </section>

      <section>
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Recent RSVPs & Comments</h2>
            <p className="text-sm text-slate-500">See the latest responses across all of your events.</p>
          </div>
          <span className="text-sm text-slate-500">{recentResponses.length} recent</span>
        </header>
        {recentResponses.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {recentResponses.map(({ guest, eventTitle, eventId, respondedAt }) => {
              const respondedAtDate = respondedAt ? new Date(respondedAt) : null;
              const formattedTimestamp = respondedAtDate
                ? respondedAtDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                : 'Time unavailable';
              const isAttending = guest.status === 'attending';

              return (
                <li key={`${guest.id}-${eventId}`} className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-5 border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isAttending ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-slate-400" />
                      )}
                      <div>
                        <p className="text-base font-semibold text-slate-800">{guest.name}</p>
                        <p className="text-sm text-slate-500">Responded for {eventTitle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{formattedTimestamp}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                    <UsersIcon className="h-4 w-4 text-primary" />
                    <span>
                      {isAttending ? 'Attending' : 'Not Attending'}
                      {guest.plusOnes > 0 && ` • +${guest.plusOnes}`}
                    </span>
                  </div>
                  {guest.comment && (
                    <p className="mt-3 text-sm italic text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      “{guest.comment}”
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-8 text-center text-slate-500">
            <p>No RSVPs yet. Once guests respond you'll see them here.</p>
          </div>
        )}
      </section>

      <section>
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
            <p className="text-sm text-slate-500">Stay ahead of the celebrations headed your way.</p>
          </div>
          <span className="text-sm text-slate-500">{upcomingEvents.length} upcoming</span>
        </header>
        {upcomingEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map(event => renderEventCard(event))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-8 text-center text-slate-500">
            <p>No upcoming events yet. Start planning your next gathering!</p>
            <Link to="/create" className="inline-flex items-center gap-2 text-primary font-semibold mt-4">
              <PlusIcon className="h-4 w-4" /> Create an event
            </Link>
          </div>
        )}
      </section>

      <section>
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Past Events</h2>
            <p className="text-sm text-slate-500">Look back at the memories you've already made.</p>
          </div>
          <span className="text-sm text-slate-500">{pastEvents.length} archived</span>
        </header>
        {pastEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {pastEvents.map(event => renderEventCard(event))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-8 text-center text-slate-500">
            <p>No past events yet. Share some invitations and see them appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
