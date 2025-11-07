import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { AppContextType, Task, Contact, Alert, Settings, ToastMessage, User, Group } from './types';
import { DashboardIcon, TasksIcon, ContactsIcon, ReportsIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon } from './components/icons';

import Dashboard from './components/Dashboard';
import TasksPage from './components/Tasks';
import ContactsPage from './components/Contacts';
import ReportsPage from './components/Reports';
import SettingsModal from './components/Settings';
import Toast from './components/common/Toast';
import LoginScreen from './components/Login';
import RegisterScreen from './components/Register';
import { exportToExcel } from './utils/helpers';

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

export default function App() {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<Settings>({ language: 'pt', dateFormat: 'DD/MM/YYYY', timezone: 'America/Sao_Paulo', backendUrl: '' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false); // Only true during explicit loads
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

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
  
  const addAlert = useCallback((message: string, type: Alert['type']) => {
    const newAlert: Alert = { id: Date.now().toString(), message, type, timestamp: new Date().toISOString(), read: false };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const fetchAppData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
        const response = await fetch(`/api/app-data/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch app data');
        const data = await response.json();
        setTasks(data.tasks || []);
        setContacts(data.contacts || []);
        setUsers(data.users || []);
        setGroups(data.groups || []);
        setSettings(data.settings || settings);
        addToast('Dados sincronizados com sucesso!', 'success');
    } catch (error) {
        console.error('Failed to load data:', error);
        addToast('Erro ao carregar dados do servidor.', 'error');
    } finally {
        setIsDataLoading(false);
    }
  }, [settings]);

  // --- Auth Logic ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }
        const user = await response.json();
        setCurrentUser(user);
        await fetchAppData(user.id);
        addToast(`Bem-vindo de volta, ${user.name}!`, 'success');
        return true;
      } catch(e) {
        console.error(e);
        return false;
      }
  };

  const handleRegister = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
          const errorData = await response.json();
          addToast(errorData.message || 'Falha no cadastro.', 'error');
          return false;
        }
        const newUser = await response.json();
        // Automatically log in the new user
        setCurrentUser(newUser);
        await fetchAppData(newUser.id); // Load initial data for new user
        addToast(`Bem-vindo, ${name}! Sua conta foi criada.`, 'success');
        return true;
    } catch(e) {
        console.error(e);
        addToast('Ocorreu um erro inesperado.', 'error');
        return false;
    }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      // Clear all local state
      setTasks([]);
      setContacts([]);
      setUsers([]);
      setGroups([]);
      addToast('Você saiu com segurança.', 'info');
  };
  
  // --- Local Preferences Logic ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
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
            {authView === 'login' ? (
                <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
            ) : (
                <RegisterScreen onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />
            )}
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
            <p className="ml-4 text-lg mt-4">Sincronizando dados...</p>
        </div>
    );
  }
  
  const appContextValue: AppContextType = {
    addToast, addAlert, tasks, setTasks, contacts, setContacts, users, setUsers, groups, setGroups, settings, currentUser,
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
