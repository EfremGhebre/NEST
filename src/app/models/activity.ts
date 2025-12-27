export interface Activity {
  id?: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  date: string;
  duration?: number; // in minutes
  location?: string;
  status: 'completed' | 'in-progress' | 'planned';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
