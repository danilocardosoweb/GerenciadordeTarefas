
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, Alert, Status } from '../types';
import { timeUntil } from '../utils/helpers';
import { useAppContext } from '../App';

interface DashboardProps {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
}

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ alerts, setAlerts }) => {
  const { tasks } = useAppContext();

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === Status.Pendente).length,
      completed: tasks.filter(t => t.status === Status.Concluida).length,
      overdue: tasks.filter(t => t.status === Status.Atrasada || (new Date(t.dueDate) < new Date() && t.status !== Status.Concluida)).length,
    };
  }, [tasks]);

  const nextTask = useMemo(() => {
    return tasks
      .filter(t => t.status !== Status.Concluida && new Date(t.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [tasks]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTasks = tasks.filter(t => t.createdAt.startsWith(date));
      return {
        name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }),
        [Status.Pendente]: dayTasks.filter(t => t.status === Status.Pendente).length,
        [Status.Concluida]: dayTasks.filter(t => t.status === Status.Concluida).length,
        [Status.Atrasada]: dayTasks.filter(t => t.status === Status.Atrasada).length,
      };
    });
  }, [tasks]);
  
  const markAlertAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Tarefas" value={stats.total} color="text-indigo-500" />
        <StatCard title="Pendentes" value={stats.pending} color="text-yellow-500" />
        <StatCard title="Concluídas" value={stats.completed} color="text-green-500" />
        <StatCard title="Atrasadas" value={stats.overdue} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="font-bold mb-4">Tarefas nos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  borderColor: 'rgba(75, 85, 99, 0.8)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey={Status.Pendente} fill="#f59e0b" name="Pendentes" />
              <Bar dataKey={Status.Concluida} fill="#10b981" name="Concluídas" />
              <Bar dataKey={Status.Atrasada} fill="#ef4444" name="Atrasadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center">
          <h3 className="font-bold mb-4">Próxima Tarefa</h3>
          {nextTask ? (
            <div>
              <p className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">{nextTask.name}</p>
              <p className="text-gray-500 dark:text-gray-400">{nextTask.description.substring(0, 50)}...</p>
              <div className="mt-4">
                <p className="text-2xl font-bold">{timeUntil(nextTask.dueDate)}</p>
                <p className="text-sm text-gray-400">restantes</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma tarefa futura encontrada.</p>
          )}
        </div>
      </div>
      
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="font-bold mb-4">Alertas Recentes</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.length > 0 ? alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-md flex justify-between items-center ${alert.read ? 'opacity-60' : ''} ${
              alert.type === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
              alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
              'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
            }`}>
              <p>{alert.message}</p>
              {!alert.read && (
                 <button onClick={() => markAlertAsRead(alert.id)} className="text-sm font-medium hover:underline">Marcar como lido</button>
              )}
            </div>
          )) : <p className="text-gray-500">Nenhum alerta novo.</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
