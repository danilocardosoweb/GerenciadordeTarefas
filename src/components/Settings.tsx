import React, { useState } from 'react';
import { Settings, UserRole } from '../types';
import Modal from './common/Modal';
import { useAppContext } from '../App';
import { mockTestEmail } from '../services/mockApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

const GeneralSettings = ({ settings, setSettings, onClose }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>>, onClose: () => void }) => {
    const { addToast } = useAppContext();
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    const [isTestingEmail, setIsTestingEmail] = useState(false);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setLocalSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
  
    const handleSave = () => {
      setSettings(localSettings);
      addToast('Preferências salvas!', 'success');
      onClose();
    };
    
    const handleTestEmail = async () => {
      setIsTestingEmail(true);
      const result = await mockTestEmail(localSettings.backendUrl);
      addToast(result.message, result.success ? 'success' : 'error');
      setIsTestingEmail(false);
    };

    return (
        <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Idioma</label>
          <select name="language" value={localSettings.language} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Formato de Data</label>
          <select name="dateFormat" value={localSettings.dateFormat} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL do Backend (API de Convites)</label>
          <input type="text" name="backendUrl" value={localSettings.backendUrl} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 p-2" />
        </div>
        
        <button onClick={handleTestEmail} disabled={isTestingEmail} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800">
           {isTestingEmail ? <div className="w-5 h-5 border-2 border-t-transparent border-indigo-500 rounded-full animate-spin"></div> : "Testar Envio de E-mail"}
        </button>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar</button>
        </div>
      </div>
    );
}

const UserSettings = () => {
    const { users, setUsers, addToast } = useAppContext();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.Membro);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        addToast('Função do usuário atualizada!', 'success');
    };

    const handleRemoveUser = (userId: string) => {
        if (window.confirm('Tem certeza que deseja remover este usuário?')) {
            setUsers(users.filter(u => u.id !== userId));
            addToast('Usuário removido!', 'success');
        }
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        if (users.some(u => u.email.toLowerCase() === inviteEmail.toLowerCase())) {
            addToast('Este e-mail já está em uso.', 'error');
            return;
        }

        const newUser = {
            id: `u${Date.now()}`,
            email: inviteEmail,
            name: inviteEmail.split('@')[0], // Simple name generation
            role: inviteRole,
            password: 'password123', // Default password for invited users
        };
        setUsers([...users, newUser]);
        addToast(`Convite enviado para ${inviteEmail}. A senha temporária é "password123".`, 'success');
        setInviteEmail('');
        setInviteRole(UserRole.Membro);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium mb-2">Membros Atuais</h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {users.map(user => (
                        <li key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                                    {getInitials(user.name)}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} className="text-sm rounded-md dark:bg-gray-600 dark:border-gray-500">
                                    <option value={UserRole.Admin}>Admin</option>
                                    <option value={UserRole.Membro}>Membro</option>
                                </select>
                                <button onClick={() => handleRemoveUser(user.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="border-t pt-4 dark:border-gray-600">
                <h3 className="text-lg font-medium mb-2">Convidar Novo Usuário</h3>
                <form onSubmit={handleInvite} className="flex items-center space-x-2">
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="E-mail do novo membro" className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value={UserRole.Membro}>Membro</option>
                        <option value={UserRole.Admin}>Admin</option>
                    </select>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Convidar</button>
                </form>
            </div>
        </div>
    );
}

const GroupSettings = () => {
    const { groups, setGroups, users, addToast } = useAppContext();
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName) return;
        const newGroup = { id: Date.now().toString(), name: newGroupName, memberIds: [] };
        setGroups([...groups, newGroup]);
        setNewGroupName('');
        addToast(`Grupo "${newGroupName}" criado!`, 'success');
    };

    const handleEditMembers = (group: typeof groups[0]) => {
        setEditingGroupId(group.id);
        setSelectedMembers(group.memberIds);
    };

    const handleMemberToggle = (userId: string) => {
        setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSaveMembers = () => {
        if (!editingGroupId) return;
        setGroups(groups.map(g => g.id === editingGroupId ? { ...g, memberIds: selectedMembers } : g));
        addToast('Membros do grupo atualizados!', 'success');
        setEditingGroupId(null);
        setSelectedMembers([]);
    };
    
    const handleDeleteGroup = (groupId: string) => {
        if (window.confirm("Tem certeza que deseja remover este grupo?")) {
            setGroups(groups.filter(g => g.id !== groupId));
            addToast('Grupo removido!', 'success');
        }
    }

    return (
        <div className="space-y-6">
             <div className="border-b pb-4 dark:border-gray-600">
                <h3 className="text-lg font-medium mb-2">Criar Novo Grupo</h3>
                <form onSubmit={handleCreateGroup} className="flex items-center space-x-2">
                    <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Nome do grupo" className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Criar</button>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-medium mb-2">Grupos Atuais</h3>
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {groups.map(group => (
                        <li key={group.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{group.name} ({group.memberIds.length} membros)</p>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEditMembers(group)} className="text-sm text-indigo-600 hover:underline">Gerenciar Membros</button>
                                     <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500 hover:text-red-700 p-1">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                     </button>
                                </div>
                            </div>
                           
                            {editingGroupId === group.id && (
                                <div className="mt-4 border-t pt-3 dark:border-gray-600">
                                    <h4 className="font-medium mb-2">Adicionar/Remover Membros</h4>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {users.map(user => (
                                             <label key={user.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <input type="checkbox" checked={selectedMembers.includes(user.id)} onChange={() => handleMemberToggle(user.id)} />
                                                <span>{user.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-3">
                                        <button onClick={() => setEditingGroupId(null)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                                        <button onClick={handleSaveMembers} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Salvar</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('general');

  const isAdmin = currentUser.role === UserRole.Admin;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preferências" size="2xl">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                    Geral
                </button>
                {isAdmin && (
                  <>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Usuários & Acessos
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`${activeTab === 'groups' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Grupos
                    </button>
                  </>
                )}
            </nav>
        </div>
        
        {activeTab === 'general' && <GeneralSettings settings={settings} setSettings={setSettings} onClose={onClose} />}
        {isAdmin && activeTab === 'users' && <UserSettings />}
        {isAdmin && activeTab === 'groups' && <GroupSettings />}

    </Modal>
  );
};

export default SettingsModal;