
import React, { useState, useMemo } from 'react';
import { Task, Contact, Priority, Status, ChangeLog } from '../types';
import Modal from './common/Modal';
import { useAppContext } from '../App';
import { formatDate, formatDateTime, downloadICS } from '../utils/helpers';
import { mockSendInvite } from '../services/mockApi';

const priorityColors: Record<Priority, string> = {
  [Priority.Baixa]: 'bg-gray-200 text-gray-800',
  [Priority.Media]: 'bg-blue-200 text-blue-800',
  [Priority.Alta]: 'bg-yellow-200 text-yellow-800',
  [Priority.Urgente]: 'bg-red-200 text-red-800',
};

const statusColors: Record<Status, string> = {
  [Status.Pendente]: 'border-yellow-500',
  [Status.EmAndamento]: 'border-blue-500',
  [Status.Concluida]: 'border-green-500',
  [Status.Atrasada]: 'border-red-500',
};

const generateChangeLog = (oldTask: Task, newTask: Task, contacts: Contact[]): ChangeLog[] => {
    const changes: ChangeLog[] = [];
    const user = contacts.find(c => c.id === newTask.responsible)?.name || 'Usuário';
    const now = new Date().toISOString();
    const contactMap = new Map(contacts.map(c => [c.id, c.name]));

    if (oldTask.name !== newTask.name) {
        changes.push({ timestamp: now, user, change: `Nome alterado de "${oldTask.name}" para "${newTask.name}".` });
    }
    if (oldTask.description !== newTask.description) {
        changes.push({ timestamp: now, user, change: `Descrição foi atualizada.` });
    }
    if (oldTask.status !== newTask.status) {
        changes.push({ timestamp: now, user, change: `Status alterado de "${oldTask.status}" para "${newTask.status}".` });
    }
    if (oldTask.priority !== newTask.priority) {
        changes.push({ timestamp: now, user, change: `Prioridade alterada de "${oldTask.priority}" para "${newTask.priority}".` });
    }
    if (oldTask.dueDate !== newTask.dueDate) {
        changes.push({ timestamp: now, user, change: `Data de vencimento alterada.` });
    }
    if (oldTask.responsible !== newTask.responsible) {
        const oldName = contactMap.get(oldTask.responsible || '') || 'Ninguém';
        const newName = contactMap.get(newTask.responsible || '') || 'Ninguém';
        changes.push({ timestamp: now, user, change: `Responsável alterado de "${oldName}" para "${newName}".` });
    }
     if (JSON.stringify(oldTask.participants.sort()) !== JSON.stringify(newTask.participants.sort())) {
        changes.push({ timestamp: now, user, change: `Lista de participantes foi atualizada.` });
    }

    return changes;
};

const TaskForm: React.FC<{ task: Task | null; onClose: () => void }> = ({ task, onClose }) => {
  const { contacts, tasks, setTasks, addToast, addAlert } = useAppContext();
  const [formData, setFormData] = useState<Task>(task || {
    id: Date.now().toString(),
    name: '',
    description: '',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
    duration: 60,
    priority: Priority.Media,
    status: Status.Pendente,
    reminderDays: 1,
    responsible: null,
    participants: [],
    tags: [],
    attachments: [],
    comments: [],
    history: [],
    createdAt: new Date().toISOString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleParticipantsChange = (contactId: string) => {
    setFormData(prev => {
        const newParticipants = prev.participants.includes(contactId) 
            ? prev.participants.filter(id => id !== contactId)
            : [...prev.participants, contactId];
        return { ...prev, participants: newParticipants };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) { // Editing
      const changes = generateChangeLog(task, formData, contacts);
      const updatedTask = { ...formData, history: [...changes, ...task.history] };
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)));
      addToast('Tarefa atualizada com sucesso!', 'success');
      addAlert(`Tarefa "${formData.name}" foi atualizada.`, 'info');
    } else { // Creating
      const newHistoryEntry: ChangeLog = {
          timestamp: new Date().toISOString(),
          user: contacts.find(c => c.id === formData.responsible)?.name || 'Usuário',
          change: 'Tarefa criada.'
      };
      setTasks([{ ...formData, history: [newHistoryEntry] }, ...tasks]);
      addToast('Tarefa criada com sucesso!', 'success');
      addAlert(`Nova tarefa "${formData.name}" foi criada.`, 'info');
    }
    onClose();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:col-span-2">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome da Tarefa" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <input type="datetime-local" name="dueDate" value={formData.dueDate.substring(0, 16)} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} placeholder="Duração (min)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </div>
           <div className="grid grid-cols-2 gap-4">
            <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
             <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
           </div>
           <select name="responsible" value={formData.responsible || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="">Selecione um responsável</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
            <div>
                <label className="font-medium">Participantes</label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded dark:border-gray-600">
                    {contacts.map(contact => (
                        <label key={contact.id} className="flex items-center space-x-2">
                            <input type="checkbox" checked={formData.participants.includes(contact.id)} onChange={() => handleParticipantsChange(contact.id)} />
                            <span>{contact.name}</span>
                        </label>
                    ))}
                </div>
            </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar</button>
          </div>
        </form>

        <div className="md:col-span-1 border-l border-gray-200 dark:border-gray-700 pl-4">
            <h3 className="text-lg font-bold mb-4">Histórico de Alterações</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {formData.history && formData.history.length > 0 ? formData.history.map(log => (
                    <div key={log.timestamp} className="flex items-start">
                         <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                         <div className="flex-grow">
                             <p className="text-sm text-gray-800 dark:text-gray-200">{log.change}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{log.user} - {formatDateTime(log.timestamp)}</p>
                         </div>
                    </div>
                )) : <p className="text-sm text-gray-500">Nenhum histórico para esta tarefa.</p>}
            </div>
        </div>
    </div>
  );
};


const TasksPage: React.FC = () => {
  const { tasks, setTasks, contacts, addToast, addAlert } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ status: '', priority: '', responsible: '' });
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      return (filters.status ? task.status === filters.status : true) &&
             (filters.priority ? task.priority === filters.priority : true) &&
             (filters.responsible ? task.responsible === filters.responsible : true);
    });
  }, [tasks, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };
  
  const handleAdd = () => {
    setSelectedTask(null);
    setModalOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const taskName = tasks.find(t => t.id === taskId)?.name || 'Tarefa';
      setTasks(tasks.filter(t => t.id !== taskId));
      addToast('Tarefa excluída com sucesso!', 'success');
      addAlert(`Tarefa "${taskName}" foi excluída.`, 'warning');
    }
  };
  
  const handleSendInvite = async (task: Task) => {
    setIsLoading(prev => ({...prev, [task.id]: true}));
    const responsible = contacts.find(c => c.id === task.responsible) || null;
    const participants = contacts.filter(c => task.participants.includes(c.id));
    
    const result = await mockSendInvite({
        task,
        responsible,
        contacts: participants,
        subject: `Convite: ${task.name}`,
        message: task.description,
    });
    
    if (result.success) {
        addToast(result.message, 'success');
        addAlert(`Convite para "${task.name}" enviado.`, 'info');
    } else {
        addToast(result.message, 'error');
        addAlert(`Falha ao enviar convite para "${task.name}".`, 'error');
    }
    setIsLoading(prev => ({...prev, [task.id]: false}));
  };
  
  const toggleStatus = (task: Task) => {
    const newStatus = task.status === Status.Concluida ? Status.Pendente : Status.Concluida;
    const user = contacts.find(c => c.id === task.responsible)?.name || 'Usuário';
    const newHistoryEntry: ChangeLog = {
      timestamp: new Date().toISOString(),
      user,
      change: `Status alterado para "${newStatus}".`
    };
    const updatedTask = { ...task, status: newStatus, history: [newHistoryEntry, ...task.history] };
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    addToast(`Status da tarefa alterado para "${newStatus}"`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
          Adicionar Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <select name="status" onChange={handleFilterChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
          <option value="">Todos os Status</option>
          {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="priority" onChange={handleFilterChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
          <option value="">Todas as Prioridades</option>
          {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="responsible" onChange={handleFilterChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
          <option value="">Todos os Responsáveis</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-l-4 ${statusColors[task.status]}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{task.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vence em: {formatDate(task.dueDate)}</p>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{task.description.substring(0, 100)}...</p>
               <div className="mt-4 flex items-center justify-between text-sm">
                 <p className="font-medium text-gray-500">Responsável:</p>
                 <p>{contacts.find(c => c.id === task.responsible)?.name || 'N/A'}</p>
               </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 flex justify-end space-x-1">
              <button onClick={() => toggleStatus(task)} className="p-1 text-gray-500 hover:text-green-600" title={task.status === Status.Concluida ? 'Reabrir' : 'Concluir'}>
                {task.status === Status.Concluida 
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.32M20 15a9 9 0 01-14.13 5.32" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              </button>
              <button onClick={() => handleSendInvite(task)} className="p-1 text-gray-500 hover:text-indigo-600" disabled={isLoading[task.id]} title="Enviar convite">
                {isLoading[task.id] ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              </button>
              <button onClick={() => downloadICS(task, contacts.find(c => c.id === task.responsible) || null, contacts.filter(c => task.participants.includes(c.id)))} className="p-1 text-gray-500 hover:text-blue-600" title="Baixar .ics">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button onClick={() => handleEdit(task)} className="p-1 text-gray-500 hover:text-yellow-600" title="Editar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-500 hover:text-red-600" title="Excluir">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'} size="3xl">
          <TaskForm task={selectedTask} onClose={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default TasksPage;
