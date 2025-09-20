import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Event } from '../types';
import { DEFAULT_EVENT_THEME } from '../types';
import DateTimePicker from './DateTimePicker';
import type { EventPayload } from '../lib/api';

interface EditEventProps {
  events: Event[];
  onSave: (eventId: string, payload: EventPayload) => Promise<Event>;
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });

const EditEvent: React.FC<EditEventProps> = ({ events, onSave }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const eventToEdit = events.find(e => e.id === eventId);

  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [showGuestList, setShowGuestList] = useState(true);
  const [allowShareLink, setAllowShareLink] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [removePassword, setRemovePassword] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_EVENT_THEME.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_EVENT_THEME.secondary);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_EVENT_THEME.background);
  const [textColor, setTextColor] = useState(DEFAULT_EVENT_THEME.text);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setHost(eventToEdit.host);
      setDate(new Date(eventToEdit.date));
      setEndDate(eventToEdit.endDate ? new Date(eventToEdit.endDate) : null);
      setLocation(eventToEdit.location);
      setMessage(eventToEdit.message);
      setShowGuestList(eventToEdit.showGuestList);
      setAllowShareLink(eventToEdit.allowShareLink ?? true);
      setPasswordProtected(eventToEdit.passwordProtected);
      setPrimaryColor(eventToEdit.theme?.primary ?? DEFAULT_EVENT_THEME.primary);
      setSecondaryColor(eventToEdit.theme?.secondary ?? DEFAULT_EVENT_THEME.secondary);
      setBackgroundColor(eventToEdit.theme?.background ?? DEFAULT_EVENT_THEME.background);
      setTextColor(eventToEdit.theme?.text ?? DEFAULT_EVENT_THEME.text);
      setBackgroundImage(eventToEdit.backgroundImage);
      setHeroImages(eventToEdit.heroImages ?? []);
      setRemovePassword(false);
      setPasswordInput('');
    }
  }, [eventToEdit]);

  const handleStartDateChange = (d: Date | null) => {
    setDate(d);
    if (endDate && d && endDate < d) {
      setEndDate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !host || !date || !location || !eventToEdit) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload: EventPayload = {
      title,
      host,
      date: date.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      location,
      message,
      showGuestList,
      allowShareLink,
      password: passwordInput ? passwordInput : undefined,
      removePassword,
      theme: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        text: textColor,
      },
      backgroundImage: backgroundImage || null,
      heroImages: heroImages.length > 0 ? heroImages : undefined,
    };

    try {
      setIsSaving(true);
      const updatedEvent = await onSave(eventToEdit.id, payload);
      navigate(`/event/${updatedEvent.id}`);
    } catch (error) {
      console.error('Unable to save event', error);
      alert('Could not update the event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackgroundChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBackgroundImage(dataUrl);
    } catch (error) {
      console.error('Unable to read background image', error);
      alert('Could not load that background image. Please try a different file.');
    }
  };

  const handleHeroImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    try {
      const dataUrls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
      setHeroImages(prev => [...prev, ...dataUrls]);
      event.target.value = '';
    } catch (error) {
      console.error('Unable to read hero images', error);
      alert('One or more images could not be loaded. Please try again.');
    }
  };

  const handleRemoveHeroImage = (index: number) => {
    setHeroImages(prev => prev.filter((_, idx) => idx !== index));
  };

  if (!eventToEdit) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold text-slate-700">Event Not Found</h2>
        <p className="text-slate-500 mt-2">Could not find the event you're trying to edit.</p>
        <Link to="/" className="mt-6 inline-block bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition">
          Create a New Event
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">Edit Your Invitation</h1>
          <p className="mt-4 text-lg text-slate-600">Update the details for your event below.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-700">Event Title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Summer BBQ Bash" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
            </div>

            <div className="space-y-2">
              <label htmlFor="host" className="text-sm font-semibold text-slate-700">Host's Name</label>
              <input id="host" type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="e.g., The Smiths" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-semibold text-slate-700">Start Date & Time</label>
                <DateTimePicker
                  selectedDate={date}
                  onChange={handleStartDateChange}
                  placeholderText="Select start date & time"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-semibold text-slate-700">End Date & Time (Optional)</label>
                <DateTimePicker
                  selectedDate={endDate}
                  onChange={setEndDate}
                  minDate={date}
                  placeholderText="Select end date & time"
                  isOptional={true}
                  disabled={!date}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold text-slate-700">Location / Address</label>
              <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., 123 Fun Street, Partyville" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-semibold text-slate-700">Event Description (Markdown supported)</label>
              <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="e.g., Join us for a day of sun, food, and fun! You can use **Markdown** for formatting." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"></textarea>
            </div>

            <div className="border-t border-b border-slate-200 py-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Appearance</h2>
                <p className="text-sm text-slate-500">Customize the backdrop and colors guests will see on the invitation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="primaryColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Primary Accent Color
                    <span className="font-normal text-xs text-slate-500">Buttons & highlights</span>
                  </label>
                  <input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-12 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="secondaryColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Secondary Color
                    <span className="font-normal text-xs text-slate-500">Badges & accents</span>
                  </label>
                  <input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full h-12 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="backgroundColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Background Color
                    <span className="font-normal text-xs text-slate-500">Fallback background</span>
                  </label>
                  <input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-12 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="textColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Text Color
                    <span className="font-normal text-xs text-slate-500">Headings & paragraphs</span>
                  </label>
                  <input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-12 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Background Image</label>
                  <input type="file" accept="image/*" onChange={handleBackgroundChange} className="w-full text-sm text-slate-500" />
                  {backgroundImage && (
                    <img src={backgroundImage} alt="Event background" className="mt-3 h-32 w-full object-cover rounded-xl border border-slate-200" />
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Hero Images (optional)</label>
                  <input type="file" accept="image/*" multiple onChange={handleHeroImagesChange} className="w-full text-sm text-slate-500" />
                  {heroImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {heroImages.map((image, index) => (
                        <div key={index} className="relative h-20 w-32">
                          <img src={image} alt={`Hero ${index + 1}`} className="h-full w-full object-cover rounded-lg border border-slate-200" />
                          <button type="button" onClick={() => handleRemoveHeroImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs font-bold">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Show guest list to attendees?</label>
                <input type="checkbox" checked={showGuestList} onChange={(e) => setShowGuestList(e.target.checked)} className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Event password</label>
                {passwordProtected && !removePassword ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    A password is currently required to view this invitation. Enter a new password below to change it, or select
                    “Remove password” to make the invite public.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Set a password if you want to require it for access.</p>
                )}
                <input
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={passwordProtected && !removePassword ? 'Enter a new password or leave blank to keep current' : 'Leave blank for no password'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                {passwordProtected && (
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={removePassword}
                      onChange={(e) => setRemovePassword(e.target.checked)}
                    />
                    Remove password protection
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Allow shareable link?</label>
                <input type="checkbox" checked={allowShareLink} onChange={(e) => setAllowShareLink(e.target.checked)} className="h-5 w-5 text-primary" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
