
import React from 'react';
import { Task, Contact, Status } from '../types';
import { formatDate } from '../utils/helpers';

interface ReportsPageProps {
  tasks: Task[];
  contacts: Contact[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ tasks, contacts }) => {
  
  const handlePrint = () => {
    window.print();
  };
  
  const contactMap = new Map(contacts.map(c => [c.id, c.name]));
  const stats = {
    completed: tasks.filter(t => t.status === Status.Concluida).length,
    overdue: tasks.filter(t => t.status === Status.Atrasada).length,
    pending: tasks.filter(t => t.status === Status.Pendente || t.status === Status.EmAndamento).length,
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
          Imprimir Relatório
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md" id="report-content">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #report-content, #report-content * {
                visibility: visible;
              }
              #report-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .dark #report-content {
                background-color: white !important;
                color: black !important;
              }
              .dark #report-content * {
                 background-color: white !important;
                color: black !important;
              }
            }
          `}
        </style>
        <header className="border-b-2 border-gray-200 dark:border-gray-700 pb-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relatório de Atividades - TaskMaster Pro</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </header>

        <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Resumo Geral</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Concluídas</p>
                </div>
                 <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</p>
                </div>
                 <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Atrasadas</p>
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-semibold mb-4">Lista de Tarefas Pendentes e Atrasadas</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="text-left p-2 font-medium">Tarefa</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-left p-2 font-medium">Vencimento</th>
                            <th className="text-left p-2 font-medium">Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.filter(t => t.status !== Status.Concluida).map(task => (
                            <tr key={task.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{task.name}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        task.status === Status.Atrasada ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                    }`}>{task.status}</span>
                                </td>
                                <td className="p-2">{formatDate(task.dueDate)}</td>
                                <td className="p-2">{contactMap.get(task.responsible || '') || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
