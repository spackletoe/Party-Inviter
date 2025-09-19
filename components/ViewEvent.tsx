import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  CheckCircleIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons';

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
  const [currentSlide, setCurrentSlide] = useState(0);
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
      setSubmitted(false);
    }
  }, [rsvpChoice]);

  const heroImages = useMemo(() => (event?.heroImages ?? []).filter(Boolean), [event]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [eventId, heroImages.length]);

  const theme = useMemo(
    () => ({
      primary: event?.theme?.primary ?? DEFAULT_EVENT_THEME.primary,
      secondary: event?.theme?.secondary ?? DEFAULT_EVENT_THEME.secondary,
      background: event?.theme?.background ?? DEFAULT_EVENT_THEME.background,
      text: event?.theme?.text ?? DEFAULT_EVENT_THEME.text,
    }),
    [event]
  );

  const backgroundStyle = useMemo<React.CSSProperties>(() => {
    if (event?.backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.9)), url(${event.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: theme.background };
  }, [event?.backgroundImage, theme.background]);

  const mutedTextColor = useMemo(() => hexToRgba(theme.text, 0.78), [theme.text]);
  const subtleTextColor = useMemo(() => hexToRgba(theme.text, 0.6), [theme.text]);
  const dividerColor = useMemo(() => hexToRgba(theme.text, 0.15), [theme.text]);
  const softPrimary = useMemo(() => hexToRgba(theme.primary, 0.12), [theme.primary]);

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

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

  const formattedStartDate = formatDateTime(event.date);
  const formattedEndDate = event.endDate ? formatDateTime(event.endDate) : null;
  const sameDay = event.endDate && new Date(event.date).toDateString() === new Date(event.endDate).toDateString();
  const showHeroControls = heroImages.length > 1;

  const handlePreviousSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <style>{`
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { margin-top: 1.2em; margin-bottom: 0.5em; font-weight: 600; color: ${theme.text}; }
        .prose h1 { font-size: 1.875rem; }
        .prose h2 { font-size: 1.5rem; }
        .prose h3 { font-size: 1.25rem; }
        .prose p { margin-bottom: 1em; color: ${mutedTextColor}; }
        .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; color: ${mutedTextColor}; }
        .prose ul { list-style-type: disc; }
        .prose ol { list-style-type: decimal; }
        .prose a { color: ${theme.primary}; text-decoration: underline; }
        .prose strong { font-weight: 600; color: ${theme.text}; }
        .prose blockquote { border-left: 4px solid ${dividerColor}; padding-left: 1em; margin-left: 0; font-style: italic; color: ${mutedTextColor}; }
        .prose code { background-color: ${softPrimary}; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .prose pre { background-color: ${softPrimary}; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
      `}</style>
      <div style={backgroundStyle} className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className={`rounded-2xl shadow-2xl shadow-slate-200 p-8 ${event.backgroundImage ? 'bg-white/85 backdrop-blur-md' : 'bg-white'}`}>
                {heroImages.length > 0 && (
                  <div className="mb-6">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg">
                      <img
                        src={heroImages[currentSlide]}
                        alt={`Event highlight ${currentSlide + 1}`}
                        className="w-full h-64 object-cover"
                      />
                      {showHeroControls && (
                        <>
                          <button
                            type="button"
                            onClick={handlePreviousSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg focus:outline-none hover:opacity-90 transition"
                            style={{ backgroundColor: theme.primary, color: '#fff' }}
                            aria-label="Previous photo"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg focus:outline-none hover:opacity-90 transition"
                            style={{ backgroundColor: theme.primary, color: '#fff' }}
                            aria-label="Next photo"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            {heroImages.map((_, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentSlide(index)}
                                className="h-2.5 w-2.5 rounded-full transition"
                                style={{
                                  backgroundColor: index === currentSlide ? theme.primary : softPrimary,
                                  border: index === currentSlide ? `1px solid ${theme.primary}` : '1px solid transparent',
                                }}
                                aria-label={`Show photo ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-base font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                    You're Invited
                  </p>
                  <h1 className="text-4xl sm:text-5xl font-extrabold" style={{ color: theme.text }}>
                    {event.title}
                  </h1>
                  <p className="mt-4 text-xl" style={{ color: mutedTextColor }}>
                    Hosted by {event.host}
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t" style={{ borderColor: dividerColor, color: theme.text }}>
                  <div className="flex items-start">
                    <CalendarIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0" style={{ color: theme.primary }} />
                    <span className="text-lg" style={{ color: mutedTextColor }}>
                      {formattedEndDate
                        ? sameDay
                          ? `${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${formatTime(event.date)} - ${formatTime(event.endDate)}`
                          : `From ${formattedStartDate} to ${formattedEndDate}`
                        : formattedStartDate}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <LocationIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0" style={{ color: theme.primary }} />
                    <span className="text-lg" style={{ color: mutedTextColor }}>
                      {event.location}
                    </span>
                  </div>
                </div>

                {event.message && (
                  <div className="mt-6 border-t pt-6" style={{ borderColor: dividerColor }}>
                    <div className="prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.message}</ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4" style={{ borderColor: dividerColor }}>
                  <Link
                    to={`/event/${event.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
                    style={{ backgroundColor: theme.primary, color: '#fff' }}
                  >
                    <PencilIcon className="h-5 w-5" /> Edit Event
                  </Link>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
                    style={{ backgroundColor: softPrimary, color: theme.text }}
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5" style={{ color: theme.primary }} /> Link Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-5 w-5" /> Copy Shareable Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className={`rounded-2xl shadow-2xl shadow-slate-200 p-8 ${event.backgroundImage ? 'bg-white/85 backdrop-blur-md' : 'bg-white'}`}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>
                  Are you coming?
                </h2>
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
                          <label htmlFor="name" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Your Name
                          </label>
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="plusOnes" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Guests you're bringing
                          </label>
                          <input
                            id="plusOnes"
                            type="number"
                            value={plusOnes}
                            onChange={(e) => {
                              const parsed = Number(e.target.value);
                              setPlusOnes(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
                            }}
                            min="0"
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Email (Optional)
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="For event updates"
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="comment" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Comment (Optional)
                          </label>
                          <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          ></textarea>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm mb-4" style={{ color: subtleTextColor }}>
                          Sorry you can't make it. Thanks for letting the host know!
                        </p>
                        <div>
                          <label htmlFor="name" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Your Name
                          </label>
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="comment" className="text-sm font-semibold" style={{ color: theme.text }}>
                            Reason (Optional)
                          </label>
                          <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            placeholder="Let the host know why you can't attend."
                            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          ></textarea>
                        </div>
                      </>
                    )}
                    <button
                      type="submit"
                      className="w-full font-bold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
                      style={{ backgroundColor: theme.primary, color: '#fff' }}
                    >
                      Submit RSVP
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpChoice(null)}
                      className="w-full text-center text-sm mt-2"
                      style={{ color: theme.primary }}
                    >
                      Change response
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setRsvpChoice('yes');
                      }}
                      className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300"
                    >
                      Yes, I'm coming
                    </button>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setRsvpChoice('no');
                      }}
                      className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-300"
                    >
                      No, can't make it
                    </button>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl shadow-2xl shadow-slate-200 p-8 ${event.backgroundImage ? 'bg-white/85 backdrop-blur-md' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <UsersIcon className="h-7 w-7" style={{ color: theme.primary }} />
                  <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
                    {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} Attending
                  </h2>
                </div>
                {event.showGuestList ? (
                  <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {attendingGuests.length > 0 ? (
                      attendingGuests.map(guest => (
                        <li key={guest.id} className="p-3 rounded-lg" style={{ backgroundColor: softPrimary }}>
                          <div className="font-semibold flex items-center gap-2" style={{ color: theme.text }}>
                            <UserIcon className="h-5 w-5" style={{ color: subtleTextColor }} />
                            {guest.name}{' '}
                            {guest.plusOnes > 0 && (
                              <span
                                className="text-xs font-normal rounded-full px-2 py-0.5"
                                style={{ backgroundColor: hexToRgba(theme.primary, 0.18), color: theme.primary }}
                              >
                                +{guest.plusOnes}
                              </span>
                            )}
                          </div>
                          {guest.comment && (
                            <p className="text-sm italic mt-1 ml-7" style={{ color: subtleTextColor }}>
                              "{guest.comment}"
                            </p>
                          )}
                        </li>
                      ))
                    ) : (
                      <p style={{ color: subtleTextColor }}>Be the first to RSVP!</p>
                    )}
                  </ul>
                ) : (
                  <p style={{ color: subtleTextColor }}>The host has chosen to keep the guest list private.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewEvent;
