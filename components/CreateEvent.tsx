import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { DEFAULT_EVENT_THEME } from '../types';
import DateTimePicker from './DateTimePicker';
import EventList from './EventList';

interface CreateEventProps {
  events: Event[];
  addEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
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

const CreateEvent: React.FC<CreateEventProps> = ({ events, addEvent, deleteEvent }) => {
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [showGuestList, setShowGuestList] = useState(true);
  const [password, setPassword] = useState('');
  const [allowShareLink, setAllowShareLink] = useState(true);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_EVENT_THEME.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_EVENT_THEME.secondary);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_EVENT_THEME.background);
  const [textColor, setTextColor] = useState(DEFAULT_EVENT_THEME.text);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleStartDateChange = (d: Date | null) => {
    setDate(d);
    if (endDate && d && endDate < d) {
      setEndDate(null);
    }
  };

  const generateEventId = () => {
    const rawId =
      typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
    return rawId.replace(/-/g, '').slice(0, 12);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !host || !date || !location) {
      alert('Please fill out all required fields.');
      return;
    }

    const eventId = generateEventId();
    const shareToken = generateEventId();
    const newEvent: Event = {
      id: eventId,
      title,
      host,
      date: date.toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
      location,
      message,
      showGuestList,
      guests: [],
      password: password ? password : undefined,
      allowShareLink,
      theme: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        text: textColor,
      },
      backgroundImage: backgroundImage || undefined,
      heroImages: heroImages.length > 0 ? heroImages : undefined,
      shareToken,
    };

    addEvent(newEvent);
    navigate(`/event/${eventId}`);
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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">Create Your Invitation</h1>
          <p className="mt-4 text-lg text-slate-600">Fill in the details below to generate a shareable page for your event.</p>
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
                    className="h-12 w-full rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="secondaryColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Secondary Accent Color
                    <span className="font-normal text-xs text-slate-500">Hover & detail moments</span>
                  </label>
                  <input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="backgroundColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Background Tint
                    <span className="font-normal text-xs text-slate-500">Visible when no image is set</span>
                  </label>
                  <input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="textColor" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Text Color
                    <span className="font-normal text-xs text-slate-500">Headings & descriptions</span>
                  </label>
                  <input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="backgroundImage" className="text-sm font-semibold text-slate-700 flex flex-col">
                    Page Background (Optional)
                    <span className="font-normal text-xs text-slate-500">A full-screen image behind your invitation</span>
                  </label>
                  <input
                    id="backgroundImage"
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                  />
                  {backgroundImage && (
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <img src={backgroundImage} alt="Background preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => setBackgroundImage(undefined)}
                        className="w-full bg-slate-100 text-slate-600 text-sm font-semibold py-2 hover:bg-slate-200 transition"
                      >
                        Remove background
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="heroImages" className="text-sm font-semibold text-slate-700 flex flex-col">
                    Hero Photos (Optional)
                    <span className="font-normal text-xs text-slate-500">Add one photo for a banner or multiple for a slideshow</span>
                  </label>
                  <input
                    id="heroImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleHeroImagesChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                  />
                  {heroImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {heroImages.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative rounded-xl overflow-hidden border border-slate-200">
                          <img src={image} alt={`Hero preview ${index + 1}`} className="w-full h-32 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveHeroImage(index)}
                            className="absolute top-2 right-2 bg-white/90 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full shadow"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex flex-col">
                  Event Password (Optional)
                  <span className="font-normal text-xs text-slate-500">Make your invitation private.</span>
                </label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="showGuestList" className="text-sm font-semibold text-slate-700 flex flex-col">
                    Show Guest List
                    <span className="font-normal text-xs text-slate-500">If unchecked, only the number of guests will be shown.</span>
                  </label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" id="showGuestList" checked={showGuestList} onChange={(e) => setShowGuestList(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                    <label htmlFor="showGuestList" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="allowShareLink" className="text-sm font-semibold text-slate-700 flex flex-col">
                    Allow Shareable Link Button
                    <span className="font-normal text-xs text-slate-500">Let guests copy a link that bypasses the password gate.</span>
                  </label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" id="allowShareLink" checked={allowShareLink} onChange={(e) => setAllowShareLink(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                    <label htmlFor="allowShareLink" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-105">
              Create Invitation
            </button>
          </form>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-16">
          <EventList events={events} onDelete={deleteEvent} />
        </div>
      )}

      <style>{`
        .toggle-checkbox:checked {
            right: 0;
            border-color: #4f46e5; /* primary color */
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #4f46e5; /* primary color */
        }
      `}</style>
    </div>
  );
};

export default CreateEvent;
