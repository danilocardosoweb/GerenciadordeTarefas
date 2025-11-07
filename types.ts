
export enum Priority {
  Baixa = 'Baixa',
  Media = 'Média',
  Alta = 'Alta',
  Urgente = 'Urgente',
}

export enum Status {
  Pendente = 'Pendente',
  EmAndamento = 'Em Andamento',
  Concluida = 'Concluída',
  Atrasada = 'Atrasada',
}

export interface ChangeLog {
  timestamp: string;
  user: string;
  change: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  duration: number; // in minutes
  priority: Priority;
  status: Status;
  reminderDays: number;
  responsible: string | null; // contact id
  participants: string[]; // contact ids
  tags: string[];
  attachments: { label: string; url: string }[];
  comments: string[];
  history: ChangeLog[];
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

export interface Alert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface Settings {
  language: 'pt' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timezone: string;
  backendUrl: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
