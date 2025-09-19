export interface Guest {
  id: string;
  name: string;
  plusOnes: number;
  comment: string;
  email?: string;
  status: 'attending' | 'not-attending';
  respondedAt?: string;
}

export interface EventTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export const DEFAULT_EVENT_THEME: EventTheme = {
  primary: '#4f46e5',
  secondary: '#6366f1',
  background: '#eef2ff',
  text: '#1e293b',
};

export interface Event {
  id: string;
  title: string;
  host: string;
  date: string;
  endDate?: string;
  location: string;
  message: string;
  showGuestList: boolean;
  guests: Guest[];
  password?: string;
  theme?: EventTheme;
  backgroundImage?: string;
  heroImages?: string[];
  allowShareLink?: boolean;
  shareToken?: string;
}
