import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Event, Guest } from '../types';
import { DEFAULT_EVENT_THEME } from '../types';
import {
  CalendarIcon,
  LocationIcon,
  UserIcon,
  UsersIcon,
  ClipboardIcon,
  CheckCircleIcon                <button
                  type="button"
                  onClick={() => setRsvpChoice('no')}
                  className={`rounded-xl border-2 py-3 font-semibold transition ${
                    rsvpChoice === 'no'
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-slate-200 text-slate-600 hover:border-secondary/50'
                  }`}
                >
                  Can't make it
                </button>Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DirectionsIcon,
} from './icons';
import type { RsvpPayload } from '../lib/api';

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map(char => `${char}${char}`)
        .join('')
    : normalized;

  if (expanded.length !== 6) {
    return `rgba(71, 85, 105, ${alpha})`;
  }

  const numeric = Number.parseInt(expanded, 16);
  if (Number.isNaN(numeric)) {
    return `rgba(71, 85, 105, ${alpha})`;
  }

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ViewEventProps {
  event: Event;
  onSubmitRsvp: (payload: RsvpPayload) => Promise<Guest>;
  isAdmin: boolean;
  shareToken: string;
  manageToken?: string | null;
}

const ADDRESS_PATTERN = /\b(street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|boulevard|blvd\.?|lane|ln\.?|way|trail|court|ct\.?,?|circle|cir\.?|place|pl\.?)\b/i;
const isLikelyAddress = (location: string) => /\d/.test(location) || ADDRESS_PATTERN.test(location);

const ViewEvent: React.FC<ViewEventProps> = ({ event, onSubmitRsvp, isAdmin, shareToken, manageToken }) => {
  const [name, setName] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rsvpChoice, setRsvpChoice] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const copyTimeoutRef = useRef<number | null>(null);

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
      setSubmitted(false);
    }
  }, [rsvpChoice]);

  const heroImages = useMemo(() => (event.heroImages ?? []).filter(Boolean), [event.heroImages]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [event.id, heroImages.length]);

  // Pre-fill form with existing guest data when manage token is present
  useEffect(() => {
    if (manageToken && event.guests) {
      const existingGuest = event.guests.find(guest => guest.manageToken === manageToken);
      if (existingGuest) {
        setName(existingGuest.name);
        setPlusOnes(existingGuest.plusOnes);
        setComment(existingGuest.comment || '');
        setEmail(existingGuest.email || '');
        setRsvpChoice(existingGuest.status === 'attending' ? 'yes' : 'no');
        setSubmitted(true);
      }
    }
  }, [manageToken, event.guests]);

  const theme = useMemo(
    () => ({
      primary: event.theme?.primary ?? DEFAULT_EVENT_THEME.primary,
      secondary: event.theme?.secondary ?? DEFAULT_EVENT_THEME.secondary,
      background: event.theme?.background ?? DEFAULT_EVENT_THEME.background,
      text: event.theme?.text ?? DEFAULT_EVENT_THEME.text,
    }),
    [event.theme],
  );

  const backgroundStyle = useMemo<React.CSSProperties>(() => {
    if (event.backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.9)), url(${event.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: theme.background };
  }, [event.backgroundImage, theme.background]);

  const mutedTextColor = useMemo(() => hexToRgba(theme.text, 0.78), [theme.text]);
  const subtleTextColor = useMemo(() => hexToRgba(theme.text, 0.6), [theme.text]);
  const dividerColor = useMemo(() => hexToRgba(theme.text, 0.15), [theme.text]);
  const softPrimary = useMemo(() => hexToRgba(theme.primary, 0.12), [theme.primary]);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please enter your name.');
      return;
    }
    if (!rsvpChoice) {
      alert('Please tell us if you can make it.');
      return;
    }

    const payload: RsvpPayload = {
      name,
      plusOnes: rsvpChoice === 'yes' ? Math.max(0, plusOnes) : 0,
      comment,
      email: rsvpChoice === 'yes' && email ? email : undefined,
      status: rsvpChoice === 'yes' ? 'attending' : 'not-attending',
    };

    try {
      setIsSubmitting(true);
      await onSubmitRsvp(payload);
      setSubmitted(true);
    } catch (error) {
      console.error('Unable to submit RSVP:', error);
      alert('We could not save your RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const hash = url.hash || '';
    const [hashPath, existingQuery = ''] = hash.split('?');
    const params = new URLSearchParams(existingQuery);
    params.set('guest', shareToken || event.shareToken);
    url.hash = `${hashPath}?${params.toString()}`;
    url.search = '';
    const shareUrl = url.toString();

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

  const attendingGuests = event.guests.filter(g => g.status === 'attending');
  const totalGuests = attendingGuests.reduce((sum, guest) => sum + 1 + guest.plusOnes, 0);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const formatDateRange = () => {
    const start = event.date ? new Date(event.date) : null;
    const end = event.endDate ? new Date(event.endDate) : null;

    if (!start || Number.isNaN(start.getTime())) {
      return 'Date not set';
    }

    if (!end || Number.isNaN(end.getTime())) {
      return formatDateTime(event.date);
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

  const renderHeroNavigation = () => {
    if (heroImages.length <= 1) {
      return null;
    }

    const total = heroImages.length;
    const goTo = (index: number) => {
      const nextIndex = (index + total) % total;
      setCurrentSlide(nextIndex);
    };

    return (
      <div className="absolute inset-0 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => goTo(currentSlide - 1)}
          className="bg-white/70 text-slate-700 rounded-full p-2 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => goTo(currentSlide + 1)}
          className="bg-white/70 text-slate-700 rounded-full p-2 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Next image"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <header className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-semibold">
                Hosted by {event.host}
              </div>
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">{event.title}</h1>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">When</p>
                    <p>{formatDateRange()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <LocationIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Where</p>
                    <p>{event.location}</p>
                    {isLikelyAddress(event.location) && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-700 mt-1"
                      >
                        <DirectionsIcon className="h-4 w-4" />
                        Get directions
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UsersIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Guest list</p>
                    <p>
                      {totalGuests} attending
                      {event.showGuestList ? ' • visible to everyone' : ' • hidden from attendees'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {isAdmin && (
              <Link
                to={`/event/${event.id}/edit`}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-700 transition"
              >
                <PencilIcon className="h-4 w-4" /> Edit Event
              </Link>
            )}
          </div>
        </header>

        {heroImages.length > 0 && (
          <section className="relative rounded-3xl overflow-hidden shadow-xl">
            <img
              src={heroImages[currentSlide]}
              alt="Event highlight"
              className="w-full h-80 object-cover"
            />
            {renderHeroNavigation()}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {heroImages.map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full transition ${index === currentSlide ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <article className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">About this celebration</h2>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-slate max-w-none event-description"
              components={{
                a: props => (
                  <a {...props} className="text-primary hover:text-primary-700" target="_blank" rel="noreferrer" />
                ),
                h1: props => <h2 {...props} className="text-2xl" />,
                h2: props => <h3 {...props} className="text-xl" />,
              }}
            >
              {event.message || 'Details coming soon!'}
            </ReactMarkdown>
          </article>

          <aside className="space-y-6">
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-6 space-y-6">
              <header>
                <h3 className="text-lg font-semibold text-slate-800">
                  {manageToken ? 'Update Your RSVP' : 'Your RSVP'}
                </h3>
                <p className="text-sm text-slate-500">
                  {manageToken 
                    ? 'Make changes to your response anytime.' 
                    : 'Let the host know if they should save you a slice of cake.'
                  }
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpChoice('yes')}
                  className={`rounded-xl border-2 py-3 font-semibold transition ${
                    rsvpChoice === 'yes'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary/50'
                  }`}
                >
                  Count me in!
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpChoice('no')}
                  className={`rounded-xl border-2 py-3 font-semibold transition ${
                    rsvpChoice === 'no'
                      ? 'border-slate-400 bg-slate-100 text-slate-600'
                      : 'border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  Can’t make it
                </button>
              </div>

              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="guest-name" className="text-sm font-semibold text-slate-700">
                    Your name
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                {rsvpChoice === 'yes' && (
                  <div className="space-y-1.5">
                    <label htmlFor="guest-email" className="text-sm font-semibold text-slate-700">
                      Email (optional)
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}

                {rsvpChoice === 'yes' && (
                  <div className="space-y-1.5">
                    <label htmlFor="guest-plus-ones" className="text-sm font-semibold text-slate-700">
                      Bringing friends?
                    </label>
                    <input
                      id="guest-plus-ones"
                      type="number"
                      min={0}
                      value={plusOnes}
                      onChange={event => setPlusOnes(Number.parseInt(event.target.value, 10) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="guest-comment" className="text-sm font-semibold text-slate-700">
                    Message for the host
                  </label>
                  <textarea
                    id="guest-comment"
                    value={comment}
                    onChange={event => setComment(event.target.value)}
                    rows={3}
                    placeholder="Add a note, song request, or dietary need."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!rsvpChoice || isSubmitting}
                  className="w-full rounded-xl bg-primary text-white font-semibold py-3 hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending…' : 'Send RSVP'}
                </button>

                {submitted && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" /> Thanks! We’ve saved your response.
                  </p>
                )}
              </form>

              <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                {event.passwordProtected ? (
                  <p>This invitation is private. Keep the password and link handy to update your RSVP later.</p>
                ) : event.allowShareLink ? (
                  <p>Share the link below if you want friends to RSVP too.</p>
                ) : (
                  <p>This invitation is private. Only invited guests can access it.</p>
                )}
              </div>
            </div>

            {event.allowShareLink && (
              <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Share this invitation</h3>
                  <ClipboardIcon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-slate-500">
                  Share this invitation link with friends and family so they can RSVP too.
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full rounded-xl bg-slate-900 text-white font-semibold py-3 hover:bg-slate-700 transition"
                >
                  {linkCopied ? 'Link copied!' : 'Share invitation link'}
                </button>
              </div>
            )}
          </aside>
        </section>

        {event.showGuestList && (
          <section className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-8 space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Guest list</h2>
                <p className="text-sm text-slate-500">See who’s coming along for the fun.</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <UserIcon className="h-4 w-4 text-primary" /> {attendingGuests.length} RSVPs
              </span>
            </header>
            {attendingGuests.length === 0 ? (
              <p className="text-slate-500 text-sm">No one has RSVP'd yet. Be the first to respond!</p>
            ) : (
              <div className="space-y-2">
                {attendingGuests.map(guest => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{guest.name}</p>
                        {guest.comment && <p className="text-xs text-slate-600 mt-0.5">"{guest.comment}"</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {guest.plusOnes > 0 ? `+${guest.plusOnes}` : ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        {guest.respondedAt
                          ? new Date(guest.respondedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="text-center text-xs text-slate-400 pb-8">
          <p>
            Need to change your RSVP? Revisit this page with the same link
            {event.passwordProtected && ' and password'}.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ViewEvent;
