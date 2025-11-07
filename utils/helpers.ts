import { Task, Contact } from '../types';
import saveAs from 'file-saver';
import * as XLSX from 'xlsx';

// --- Debounce Utility ---
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};


// --- Date Utils ---
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC' });
};

export const timeUntil = (dateString: string): string => {
  const now = new Date();
  const future = new Date(dateString);
  const diff = future.getTime() - now.getTime();

  if (diff <= 0) return "Expirado";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  
  return `${days}d ${hours}h ${minutes}m`;
};

// --- ICS Utils ---
const toICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICS = (task: Task, responsible: Contact | null, participants: Contact[]): string => {
  const startDate = new Date(task.dueDate);
  const endDate = new Date(startDate.getTime() + task.duration * 60000);
  
  let alarmLines: string[] = [];
  if (task.reminderValue > 0) {
    const triggerValue = task.reminderValue;
    const triggerUnit = task.reminderUnit === 'days' ? 'D' : 'H';
    const timePrefix = task.reminderUnit === 'hours' ? 'T' : '';
    
    alarmLines = [
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete',
        `TRIGGER:-P${timePrefix}${triggerValue}${triggerUnit}`,
        'END:VALARM'
    ];
  }

  let icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GerenciadorDeTarefas//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${task.id}@gerenciador.tarefas`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${task.name}`,
    `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`,
    `LOCATION:N/A`,
    `STATUS:CONFIRMED`,
    ...alarmLines
  ];

  if (responsible) {
    icsString.push(`ORGANIZER;CN=${responsible.name}:mailto:${responsible.email}`);
    icsString.push(`ATTENDEE;ROLE=CHAIR;PARTSTAT=NEEDS-ACTION;CN=${responsible.name}:mailto:${responsible.email}`);
  }

  participants.forEach(p => {
    icsString.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${p.name}:mailto:${p.email}`);
  });

  icsString.push('END:VEVENT');
  icsString.push('END:VCALENDAR');

  return icsString.join('\r\n');
};

export const downloadICS = (task: Task, responsible: Contact | null, participants: Contact[]) => {
  const icsContent = generateICS(task, responsible, participants);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  saveAs(blob, `${task.name.replace(/ /g, '_')}.ics`);
};

// --- Export Utils ---
export const exportToExcel = (tasks: Task[], contacts: Contact[]) => {
  const contactMap = new Map(contacts.map(c => [c.id, c.name]));

  const tasksData = tasks.map(task => ({
    'Nome da Tarefa': task.name,
    'Descrição': task.description,
    'Data de Vencimento': formatDateTime(task.dueDate),
    'Duração (min)': task.duration,
    'Prioridade': task.priority,
    'Status': task.status,
    'Responsável': task.responsible ? contactMap.get(task.responsible) : 'N/A',
    'Participantes': task.participants.map(id => contactMap.get(id)).join(', '),
    'Tags': task.tags.join(', '),
    'Criado em': formatDateTime(task.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(tasksData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');
  XLSX.writeFile(workbook, 'Tarefas_Gerenciador_de_Tarefas.xlsx');
};