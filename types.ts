import { Type } from "@google/genai";

export enum RevisionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export interface Revision {
  id: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  status: RevisionStatus;
  googleEventId?: string;
}

export interface Topic {
  id: string;
  title: string;
  subject: string;
  startDate: string; // The date the user started/learned this
  addedDate: string; // Metadata for when record was created
  notes?: string; // HTML content from rich text editor
  revisions: Revision[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface AIInsight {
  productivityScore: number;
  summary: string;
  tips: string[];
  lastUpdated: string; // ISO Date
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:mm format (24h)
  missedStrategy: 'shift' | 'static' | 'double'; // Shift dates, keep static, or double workload
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface QuizResult {
  date: string;
  topicId: string;
  score: number;
  totalQuestions: number;
}

export interface AppSettings {
  subjects: string[];
  defaultIntervals: number[];
  autoReschedule: boolean;
  googleCalendarConnected: boolean;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  subjects: ['Math', 'Science', 'History', 'Language', 'Coding'],
  defaultIntervals: [1, 7, 14, 30, 60], // Standard spacing
  autoReschedule: true,
  googleCalendarConnected: false,
  notifications: {
    enabled: false,
    reminderTime: '09:00',
    missedStrategy: 'shift'
  }
};