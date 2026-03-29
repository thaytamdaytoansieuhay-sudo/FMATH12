
export interface TheorySection {
  title: string;
  content: string; // Markdown with LaTeX
}

export interface LessonContent {
  topic: string;
  theory: string; // Fallback string
  theorySections?: TheorySection[]; // Structured sections
  exercises: Exercise[];
}

export interface PracticeConfig {
  mcPure: number;
  mcReal: number;
  tfPure: number;
  tfReal: number;
  saPure: number;
  saReal: number;
}

export type ExerciseType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface TFItem {
  id: string; // 'a', 'b', 'c', 'd'
  statement: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  category?: 'pure' | 'real'; // Phân loại toán thuần túy hoặc thực tế
  question: string; // Main question text
  
  // Multiple Choice specific
  options?: string[]; // Array of 4 strings
  mcAnswer?: string; // 'A', 'B', 'C', or 'D'
  
  // True/False specific
  tfItems?: TFItem[];
  
  // Short Answer specific
  saAnswer?: string;
  
  // Common
  solution: string; // Detailed solution
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TextbookChapter {
  title: string;
  lessons: string[];
}

export enum AppStatus {
  IDLE,
  LOADING,
  VIEWING_LESSON,
  ERROR,
  GENERATING
}

export interface QuizConfig {
  mcCount: number;
  tfCount: number;
  saCount: number;
}
export interface QuizData {
  topic: string;
  multipleChoice: any[];
  trueFalseQuestions: any[];
  shortAnswer: any[];
}
export interface UserAnswers {
  multipleChoice: Record<number, string>;
  trueFalse: Record<string, boolean>;
  shortAnswer: Record<number, string>;
}
