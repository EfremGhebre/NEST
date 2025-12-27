export interface Quote {
  id: number;
  title: string;
  author: string;
  description: string;
  userId?: number;
  source?: string;
  category?: string;
  date?: string;
  tags?: string[];
  notes?: string;
}


