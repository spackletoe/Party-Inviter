import type { Event, EventTheme, Guest } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface ApiEvent {
  id: string;
  title: string;
  host: string;
  date: string;
  endDate?: string | null;
  location: string;
  message: string;
  showGuestList: boolean;
  passwordProtected: boolean;
  allowShareLink: boolean;
  shareToken: string;
  theme?: EventTheme | null;
  backgroundImage?: string | null;
  heroImages?: string[] | null;
  guests: Guest[];
}

export interface EventPayload {
  title: string;
  host: string;
  date: string;
  endDate?: string | null;
  location: string;
  message: string;
  showGuestList: boolean;
  allowShareLink: boolean;
  password?: string | null;
  removePassword?: boolean;
  theme?: EventTheme;
  backgroundImage?: string | null;
  heroImages?: string[];
}

export interface AccessResultAdmin {
  type: 'admin';
  token: string;
}

export interface AccessResultEvent {
  type: 'event';
  eventId: string;
  shareToken: string;
  guestToken?: string;
}

export type AccessResult = AccessResultAdmin | AccessResultEvent;

interface RequestOptions extends RequestInit {
  token?: string | null;
}

const withHeaders = (options: RequestOptions = {}): RequestInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const existing = options.headers as Record<string, string>;
    Object.keys(existing).forEach(key => {
      headers[key] = existing[key];
    });
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return {
    ...options,
    headers,
  };
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL in your environment.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, withHeaders(options));
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    (error as Error & { status?: number; payload?: unknown }).status = response.status;
    (error as Error & { status?: number; payload?: unknown }).payload = data;
    throw error;
  }

  return data as T;
};

const mapEvent = (apiEvent: ApiEvent): Event => ({
  id: apiEvent.id,
  title: apiEvent.title,
  host: apiEvent.host,
  date: apiEvent.date,
  endDate: apiEvent.endDate ?? undefined,
  location: apiEvent.location,
  message: apiEvent.message,
  showGuestList: apiEvent.showGuestList,
  allowShareLink: apiEvent.allowShareLink,
  passwordProtected: apiEvent.passwordProtected,
  shareToken: apiEvent.shareToken,
  theme: apiEvent.theme ?? undefined,
  backgroundImage: apiEvent.backgroundImage ?? undefined,
  heroImages: apiEvent.heroImages ?? undefined,
  guests: apiEvent.guests || [],
});

export const submitAccessPassword = (password: string) =>
  request<AccessResult>('/api/access', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

export const fetchAdminEvents = async (token: string): Promise<Event[]> => {
  const events = await request<ApiEvent[]>('/api/admin/events', { token });
  return events.map(mapEvent);
};

export const createEvent = async (token: string, payload: EventPayload): Promise<Event> => {
  const event = await request<ApiEvent>('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
  return mapEvent(event);
};

export const updateEvent = async (token: string, eventId: string, payload: EventPayload): Promise<Event> => {
  const event = await request<ApiEvent>(`/api/admin/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    token,
  });
  return mapEvent(event);
};

export const deleteEvent = (token: string, eventId: string) =>
  request<void>(`/api/admin/events/${eventId}`, {
    method: 'DELETE',
    token,
  });

interface PublicEventResponse {
  event?: ApiEvent;
  requiresPassword?: boolean;
}

export const fetchPublicEvent = async (
  shareToken: string,
  guestToken?: string | null,
): Promise<{ event: Event | null; requiresPassword: boolean }> => {
  try {
    const response = await request<PublicEventResponse>(`/api/public/events/${shareToken}`, {
      headers: guestToken ? { Authorization: `Bearer ${guestToken}` } : undefined,
    });

    if (response.event) {
      return { event: mapEvent(response.event), requiresPassword: false };
    }

    return { event: null, requiresPassword: Boolean(response.requiresPassword) };
  } catch (error) {
    const status = (error as Error & { status?: number; payload?: PublicEventResponse }).status;
    const payload = (error as Error & { status?: number; payload?: PublicEventResponse }).payload;
    if (status === 401 && payload?.requiresPassword) {
      return { event: null, requiresPassword: true };
    }
    throw error;
  }
};

export const authorizeEventAccess = (shareToken: string, password: string) =>
  request<{ guestToken: string; eventId: string }>(`/api/public/events/${shareToken}/access`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

export interface RsvpPayload {
  name: string;
  plusOnes: number;
  comment: string;
  email?: string;
  status: 'attending' | 'not-attending';
}

interface RsvpResponse {
  event: ApiEvent;
  guest: Guest;
  guestToken?: string;
  manageToken?: string;
}

export const submitRsvp = async (
  shareToken: string,
  payload: RsvpPayload,
  guestToken?: string | null,
  manageToken?: string | null,
) => {
  const response = await request<RsvpResponse>(`/api/public/events/${shareToken}/rsvps`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, manageToken }),
    headers: guestToken ? { Authorization: `Bearer ${guestToken}` } : undefined,
  });

  return {
    ...response,
    event: mapEvent(response.event),
  };
};

export const refreshAdminToken = (token: string) =>
  request<{ token: string }>('/api/admin/token', {
    method: 'POST',
    token,
  });

export const getEventGuests = async (token: string, eventId: string): Promise<Guest[]> => {
  return request<Guest[]>(`/api/admin/events/${eventId}/guests`, { token });
};

export const removeGuest = async (token: string, eventId: string, guestId: string): Promise<void> => {
  return request<void>(`/api/admin/events/${eventId}/guests/${guestId}`, {
    method: 'DELETE',
    token,
  });
};

export const addGuest = async (token: string, eventId: string, guestData: {
  name: string;
  email?: string;
  plusOnes?: number;
  comment?: string;
}): Promise<Guest> => {
  return request<Guest>(`/api/admin/events/${eventId}/guests`, {
    method: 'POST',
    body: JSON.stringify(guestData),
    token,
  });
};

export const sendGuestInvite = async (token: string, eventId: string, guestId: string): Promise<void> => {
  return request<void>(`/api/admin/events/${eventId}/guests/${guestId}/send-invite`, {
    method: 'POST',
    token,
  });
};
