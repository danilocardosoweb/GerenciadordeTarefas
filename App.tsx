import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { AppContextType, Task, Contact, Alert, Settings, Priority, Status, ToastMessage, User, UserRole, Group, TaskVisibility } from './types';
import { DashboardIcon, TasksIcon, ContactsIcon, ReportsIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon } from './components/icons';

import Dashboard from './components/Dashboard';
import TasksPage from './components/Tasks';
import ContactsPage from './components/Contacts';
import ReportsPage from './components/Reports';
import SettingsModal from './components/Settings';
import Toast from './components/common/Toast';
import LoginScreen from './components/Login';
import { exportToExcel, debounce } from './utils/helpers';


const initialContacts: Contact[] = [
  { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: '123-456-7890', company: 'Inovatech', role: 'Developer' },
  { id: 'c2', name: 'Bob', email: 'bob@example.com', phone: '234-567-8901', company: 'SysCorp', role: 'Manager' },
  { id: 'c3', name: 'Carol', email: 'carol@example.com', phone: '345-678-9012', company: 'Inovatech', role: 'Designer' },
];

const initialUsers: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@taskmaster.pro', role: UserRole.Admin },
    { id: 'u2', name: 'Alice', email: 'alice@example.com', role: UserRole.Membro },
    { id: 'u3', name: 'Bob', email: 'bob@example.com', role: UserRole.Membro },
];

const initialGroups: Group[] = [
    { id: 'g1', name: 'Equipe de Design', memberIds: ['u1', 'u3'] },
    { id: 'g2', name: 'Equipe de Backend', memberIds: ['u1', 'u2'] },
];

const initialTasks: Task[] = [
    { id: 't1', name: 'Design do novo dashboard', description: 'Criar mockups de alta fidelidade para o dashboard v2.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 240, priority: Priority.Alta, status: Status.EmAndamento, reminderValue: 1, reminderUnit: 'days', responsible: 'c3', participants: ['c1', 'c2'], tags: ['design', 'ui/ux'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString(), creatorId: 'u1', visibility: TaskVisibility.Group, groupId: 'g1' },
    { id: 't2', name: 'Desenvolver API de autenticação', description: 'Implementar endpoints para login e registro de usuários.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 480, priority: Priority.Urgente, status: Status.Pendente, reminderValue: 2, reminderUnit: 'days', responsible: 'c1', participants: ['c2'], tags: ['backend', 'security'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString(), creatorId: 'u2', visibility: TaskVisibility.Group, groupId: 'g2' },
    { id: 't3', name: 'Reunião de planejamento da Sprint', description: 'Definir o escopo da próxima sprint com a equipe.', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 60, priority: Priority.Media, status: Status.Pendente, reminderValue: 2, reminderUnit: 'hours', responsible: 'c2', participants: ['c1', 'c3'], tags: ['meeting', 'planning'], attachments: [], comments: [], history: [{ timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString(), creatorId: 'u1', visibility: TaskVisibility.Public, groupId: null },
    { id: 't4', name: 'Corrigir bug no formulário de contato', description: 'O formulário não está enviando e-mails.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 120, priority: Priority.Alta, status: Status.Atrasada, reminderValue: 1, reminderUnit: 'days', responsible: 'c1', participants: [], tags: ['bugfix', 'frontend'], attachments: [], comments: [], history: [ { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), user: 'Alice', change: 'Status alterado para Em Andamento.' }, { timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString(), creatorId: 'u2', visibility: TaskVisibility.Private, groupId: null },
    { id: 't5', name: 'Atualizar documentação da API', description: 'Gerar nova documentação Swagger.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), duration: 180, priority: Priority.Baixa, status: Status.Concluida, reminderValue: 5, reminderUnit: 'days', responsible: 'c1', participants: [], tags: ['docs'], attachments: [], comments: [], history: [ { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), user: 'Alice', change: 'Status alterado para Concluída.' }, { timestamp: new Date().toISOString(), user: 'Sistema', change: 'Tarefa criada.' }], createdAt: new Date().toISOString(), creatorId: 'u1', visibility: TaskVisibility.Public, groupId: null },
];

const initialAlerts: Alert[] = [
    { id: 'a1', message: 'Tarefa "Corrigir bug no formulário de contato" está atrasada!', type: 'error', timestamp: new Date().toISOString(), read: false },
    { id: 'a2', message: 'Bem-vindo ao Gerenciador de Tarefas! Comece criando uma nova tarefa.', type: 'info', timestamp: new Date().toISOString(), read: false },
];

const initialData = {
    tasks: initialTasks,
    contacts: initialContacts,
    users: initialUsers,
    groups: initialGroups,
    alerts: initialAlerts,
    // FIX: Cast settings object to Settings to prevent type widening.
    settings: { language: 'pt', dateFormat: 'DD/MM/YYYY', timezone: 'America/Sao_Paulo', backendUrl: 'http://localhost:3000/api' } as Settings
}

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

export default function App() {
  // State management
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<Settings>(initialData.settings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Local state for theme and current user session
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark' | null) || 'light');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // --- Data Persistence Logic ---
  const saveDataToBackend = useCallback(debounce(async (data: Omit<typeof initialData, 'theme' | 'currentUser'>) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to save data:', error);
      addToast('Erro ao salvar dados no servidor.', 'error');
    }
  }, 1500), [addToast]);

  useEffect(() => {
    if (!currentUser || isDataLoading) return; // Don't save while loading or logged out
    saveDataToBackend({ tasks: allTasks, contacts, users, groups, alerts, settings });
  }, [allTasks, contacts, users, groups, alerts, settings, saveDataToBackend, currentUser, isDataLoading]);

  useEffect(() => {
    if (!currentUser) {
      setIsDataLoading(false);
      return;
    }

    const loadDataFromBackend = async () => {
      setIsDataLoading(true);
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          setAllTasks(data.tasks || initialData.tasks);
          setContacts(data.contacts || initialData.contacts);
          setUsers(data.users || initialData.users);
          setGroups(data.groups || initialData.groups);
          setAlerts(data.alerts || initialData.alerts);
          // FIX: Cast settings from API to Settings type.
          setSettings((data.settings as Settings) || initialData.settings);
        } else {
          // If 404 or other error, assume first run and upload initial data
          addToast('Configurando sua conta pela primeira vez...', 'info');
          setAllTasks(initialData.tasks);
          setContacts(initialData.contacts);
          setUsers(initialData.users);
          setGroups(initialData.groups);
          setAlerts(initialData.alerts);
          setSettings(initialData.settings);
          await saveDataToBackend(initialData);
        }
      } catch (error) {
        console.error('Failed to load data from backend:', error);
        addToast('Não foi possível carregar os dados. Usando dados offline.', 'error');
        // Fallback to initial data if backend is down
        setAllTasks(initialData.tasks);
        setContacts(initialData.contacts);
        setUsers(initialData.users);
        setGroups(initialData.groups);
        setAlerts(initialData.alerts);
        setSettings(initialData.settings);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadDataFromBackend();
  }, [currentUser]); // Reload data when user changes

  // --- Auth Logic ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
      await new Promise(res => setTimeout(res, 500));
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user && password === 'password') { 
          setCurrentUser(user);
          addToast(`Bem-vindo de volta, ${user.name}!`, 'success');
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setCurrentUser(null);
      addToast('Você saiu com segurança.', 'info');
  };
  
  // --- Local Preferences Logic ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);
  
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  
  const addAlert = useCallback((message: string, type: Alert['type']) => {
    const newAlert: Alert = { id: Date.now().toString(), message, type, timestamp: new Date().toISOString(), read: false };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const tasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.Admin) return allTasks;
    const userGroupIds = new Set(groups.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
    return allTasks.filter(task => {
        if (task.visibility === TaskVisibility.Public) return true;
        if (task.visibility === TaskVisibility.Private) {
            const allowedUsers = new Set([task.creatorId, task.responsible, ...task.participants]);
            return allowedUsers.has(currentUser.id);
        }
        if (task.visibility === TaskVisibility.Group) return task.groupId && userGroupIds.has(task.groupId);
        return false;
    });
  }, [allTasks, currentUser, groups]);


  const navItems = [
    { name: 'Dashboard', icon: DashboardIcon }, { name: 'Tarefas', icon: TasksIcon }, { name: 'Contatos', icon: ContactsIcon }, { name: 'Relatórios', icon: ReportsIcon },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard alerts={alerts} setAlerts={setAlerts} />;
      case 'Tarefas': return <TasksPage />;
      case 'Contatos': return <ContactsPage />;
      case 'Relatórios': return <ReportsPage tasks={tasks} contacts={contacts}/>;
      default: return <Dashboard alerts={alerts} setAlerts={setAlerts} />;
    }
  };
  
  // --- RENDER LOGIC ---

  if (!currentUser) {
    return (
      <>
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <LoginScreen onLogin={handleLogin} />
        </div>
        <div className="fixed top-5 right-5 z-50">
          {toasts.map(toast => <Toast key={toast.id} message={toast} onDismiss={removeToast} />)}
        </div>
      </>
    );
  }

  if (isDataLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="w-16 h-16 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg mt-4">Carregando dados...</p>
        </div>
    );
  }
  
  const appContextValue: AppContextType = {
    addToast, addAlert, tasks, setTasks: setAllTasks, contacts, setContacts, users, setUsers, groups, setGroups, settings, currentUser,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="h-16 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700">Gerenciador</div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map(item => (
              <button key={item.name} onClick={() => setActivePage(item.name)} className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${activePage === item.name ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <item.icon className="w-6 h-6 mr-3" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
             <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <SettingsIcon className="w-6 h-6 mr-3" /><span className="font-medium">Preferências</span>
              </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center"><input type="search" placeholder="Busca global..." className="bg-gray-100 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 py-2"/></div>
            <div className="flex items-center space-x-4">
               <button onClick={() => exportToExcel(tasks, contacts)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"><svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">{theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}</button>
               <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">{currentUser.name.split(' ').map(n=>n[0]).join('')}</div>
                    <span className="ml-2 font-semibold text-sm">{currentUser.name}</span>
                    <button onClick={handleLogout} className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" title="Sair"><LogoutIcon className="w-6 h-6" /></button>
               </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">{renderPage()}</main>
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />

      <div className="fixed top-5 right-5 z-50">
        {toasts.map(toast => <Toast key={toast.id} message={toast} onDismiss={removeToast} />)}
      </div>
    </AppContext.Provider>
  );
}