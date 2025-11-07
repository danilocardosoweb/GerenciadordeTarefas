import React from 'react';

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

export enum UserRole {
  Admin = 'Admin',
  Membro = 'Membro',
}

export enum TaskVisibility {
  Public = 'Pública',
  Private = 'Privada',
  Group = 'Grupo',
}

export interface ChangeLog {
  timestamp: string;
  user: string;
  change: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  duration: number; // in minutes
  priority: Priority;
  status: Status;
  reminderValue: number;
  reminderUnit: 'days' | 'hours';
  responsible: string | null; // contact id
  participants: string[]; // contact ids
  tags: string[];
  attachments: { label: string; url: string }[];
  comments: string[];
  history: ChangeLog[];
  createdAt: string;
  creatorId: string;
  visibility: TaskVisibility;
  groupId: string | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

export type AppContextType = {
  addToast: (message: string, type: ToastMessage['type']) => void;
  addAlert: (message: string, type: Alert['type']) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  settings: Settings;
  currentUser: User;
};
