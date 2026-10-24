export interface Lesson {
  id: string;
  title: string;
  description: string;
  grade: number;
  pdf_path: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Visit {
  id: number;
  visited_at: string;
}

export interface UserRole {
  user_id: string;
  role: 'admin';
}
