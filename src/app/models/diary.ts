export interface Diary {
  id: number;
  title: string;
  body: string;
  userId?: number;
  createdAt?: string; // ISO date string
  date?: string;
  mood?: string;
  weather?: string;
  location?: string;
  tags?: string[];
  privateNotes?: string;
}


