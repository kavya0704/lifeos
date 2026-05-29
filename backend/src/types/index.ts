export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface DailyScheduleBlock {
  startTime: string; // HH:MM
  title: string;
  duration: number; // minutes
  description: string;
}

export interface ReviewScores {
  productivityScore: number;
  disciplineScore: number;
  consistencyScore: number;
  suggestions: string;
}
