import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import DateTimePicker from './DateTimePicker';

interface CreateEventProps {
  addEvent: (event: Event) => void;
}

const CreateEvent: React.FC<CreateEventProps> = ({ addEvent }) => {
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [showGuestList, setShowGuestList] = useState(true);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleStartDateChange = (d: Date | null) => {
    setDate(d);
    if (endDate && d && endDate < d) {
        setEndDate(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !host || !date || !location) {
      alert('Please fill out all required fields.');
      return;
    }

    const eventId = Math.random().toString(36).substring(2, 10);
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
      password: password || undefined,
    };

    addEvent(newEvent);
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
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
          
          <div className="border-t border-b border-slate-200 py-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex flex-col">
                    Event Password (Optional)
                    <span className="font-normal text-xs text-slate-500">Make your invitation private.</span>
                </label>
                <input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
              </div>

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
          </div>

          <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-105">
            Create Invitation
          </button>
        </form>
      </div>
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