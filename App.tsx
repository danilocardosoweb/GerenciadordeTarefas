
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task, Contact, Alert, Settings, Priority, Status, ToastMessage, ChangeLog } from './types';
import { DashboardIcon, TasksIcon, ContactsIcon, ReportsIcon, SettingsIcon, SunIcon, MoonIcon } from './components/icons';

import Dashboard from './components/Dashboard';
import TasksPage from './components/Tasks';
import ContactsPage from './components/Contacts';
import ReportsPage from './components/Reports';
import SettingsModal from './components/Settings';
import Toast from './components/common/Toast';
import { exportToExcel } from './utils/helpers';


const initialContacts: Contact[] = [
  { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: '123-456-7890', company: 'Inovatech', role: 'Developer' },
  { id: 'c2', name: 'Bob', email: 'bob@example.com', phone: '234-567-8901', company: 'SysCorp', role: 'Manager' },
  { id: 'c3', name: 'Carol', email: 'carol@example.com', phone: '345-678-9012', company: 'Inovatech', role: 'Designer' },
];

const initialTasks: Task[] = [
    { id: 't1', name: 'Design do novo dashboard', description: 'Criar mockups de alta fidelidade para o dashboard v2.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 240, priority: Priority.Alta, status: Status.EmAndamento, reminderDays: 1, responsible: 'c3', participants: ['c1', 'c2'], tags: ['design', 'ui/ux'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString() },
    { id: 't2', name: 'Desenvolver API de autenticação', description: 'Implementar endpoints para login e registro de usuários.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 480, priority: Priority.Urgente, status: Status.Pendente, reminderDays: 2, responsible: 'c1', participants: ['c2'], tags: ['backend', 'security'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString() },
    { id: 't3', name: 'Reunião de planejamento da Sprint', description: 'Definir o escopo da próxima sprint com a equipe.', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 60, priority: Priority.Media, status: Status.Pendente, reminderDays: 0, responsible: 'c2', participants: ['c1', 'c3'], tags: ['meeting', 'planning'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString() },
    { id: 't4', name: 'Corrigir bug no formulário de contato', description: 'O formulário não está enviando e-mails.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 120, priority: Priority.Alta, status: Status.Atrasada, reminderDays: 1, responsible: 'c1', participants: [], tags: ['bugfix', 'frontend'], attachments: [], comments: [], history: [ { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), user: 'Alice', change: 'Status alterado para Em Andamento.' }, { timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString() },
    { id: 't5', name: 'Atualizar documentação da API', description: 'Gerar nova documentação Swagger.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), duration: 180, priority: Priority.Baixa, status: Status.Concluida, reminderDays: 5, responsible: 'c1', participants: [], tags: ['docs'], attachments: [], comments: [], history: [ { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), user: 'Alice', change: 'Status alterado para Concluída.' }, { timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString() },
];

const initialAlerts: Alert[] = [
    { id: 'a1', message: 'Tarefa "Corrigir bug no formulário de contato" está atrasada!', type: 'error', timestamp: new Date().toISOString(), read: false },
    { id: 'a2', message: 'Bem-vindo ao TaskMaster Pro! Comece criando uma nova tarefa.', type: 'info', timestamp: new Date().toISOString(), read: false },
];


type AppContextType = {
  addToast: (message: string, type: ToastMessage['type']) => void;
  addAlert: (message: string, type: Alert['type']) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  settings: Settings;
};

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

export default function App() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [activePage, setActivePage] = useState('Dashboard');
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', initialTasks);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', initialContacts);
  const [alerts, setAlerts] = useLocalStorage<Alert[]>('alerts', initialAlerts);
  const [settings, setSettings] = useLocalStorage<Settings>('settings', { language: 'pt', dateFormat: 'DD/MM/YYYY', timezone: 'America/Sao_Paulo', backendUrl: 'http://localhost:3000/api' });
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  const addAlert = useCallback((message: string, type: Alert['type']) => {
    const newAlert: Alert = { id: Date.now().toString(), message, type, timestamp: new Date().toISOString(), read: false };
    setAlerts(prev => [newAlert, ...prev]);
  }, [setAlerts]);


  const navItems = [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Tarefas', icon: TasksIcon },
    { name: 'Contatos', icon: ContactsIcon },
    { name: 'Relatórios', icon: ReportsIcon },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard alerts={alerts} setAlerts={setAlerts} />;
      case 'Tarefas':
        return <TasksPage />;
      case 'Contatos':
        return <ContactsPage />;
      case 'Relatórios':
        return <ReportsPage tasks={tasks} contacts={contacts}/>;
      default:
        return <Dashboard alerts={alerts} setAlerts={setAlerts} />;
    }
  };
  
  const appContextValue = {
    addToast,
    addAlert,
    tasks,
    setTasks,
    contacts,
    setContacts,
    settings,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="h-16 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700">
            TaskMaster
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activePage === item.name
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-6 h-6 mr-3" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
             <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SettingsIcon className="w-6 h-6 mr-3" />
                <span className="font-medium">Preferências</span>
              </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center">
              <input 
                type="search"
                placeholder="Busca global..."
                className="bg-gray-100 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 py-2"
              />
            </div>
            <div className="flex items-center space-x-4">
               <button onClick={() => exportToExcel(tasks, contacts)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
              </button>
            </div>
          </header>
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {renderPage()}
          </main>
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />

      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>
    </AppContext.Provider>
  );
}
