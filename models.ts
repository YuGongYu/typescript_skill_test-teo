// models.ts
export interface AnswerByIdQuery {
  id: string;
}

export interface ScoreByIsinQuery {
  isin: string;
  start?: string;
  end?: string;
}

export interface AnswersQuery {
  isin?: string;
  start?: string; // ISO 8601
  end?: string; // ISO 8601
  ids?: string; // comma-separated
  user?: string;
  limit?: string;
  offset?: string;
}

export interface Answer {
  value: number;
  source: string;
  created: string; // ISO 8601
  skip: boolean;
  id: string;
  user: string;
  company: Company;
  question: Question;
}

export interface Company {
  standby: boolean;
  title: string;
  tid: number;
  isin: string;
  id: number;
}

export interface Question {
  fullText: string;
  shortText: string;
  tag: string;
  id: string;
  isPublic: boolean;
  isActive: boolean;
  translations?: Record<string, Partial<Question>>;
}
