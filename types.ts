export type AcademicLevel = 'Ensino Secundário' | 'Ensino Médio' | 'Técnico' | 'Universidade';
export type Style = 'Simples' | 'Normal' | 'Aluno médio';
export type Language = 'Português Angola' | 'Português Brasil' | 'Português Portugal';
export type Grade = '10-14' | '14-17' | '17-20';
export type OrderStatus = 'Pendente' | 'Aprovado' | 'Rejeitado';
export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
}

export interface PaperRequest {
  theme: string;
  discipline: string;
  level: AcademicLevel;
  pages: number;
  style: Style;
  language: Language;
  grade: Grade;
}

export interface GeneratedPaper {
  title: string;
  content: string; // HTML or Markdown string
  request: PaperRequest;
  timestamp: Date;
}

export interface Order {
  id: string;
  user: string;
  theme: string;
  date: string;
  status: OrderStatus;
  amount: number;
  proofUrl?: string; // Mock URL for proof image
  paperContent?: string;
  paperRequest?: PaperRequest;
}

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  accountHolder: string;
}

export interface SystemSettings {
  price: number;
  bankAccounts: BankAccount[];
}