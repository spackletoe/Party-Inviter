export interface Guest {
  id: string;
  name: string;
  plusOnes: number;
  comment: string;
  email?: string;
  status: 'attending' | 'not-attending';
}

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
}