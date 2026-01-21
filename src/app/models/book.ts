export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  userId?: number;
  publicationYear?: number;
  genre?: string;
  rating?: string;
  pages?: number;
  status?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
}


