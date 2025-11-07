
import React, { useState } from 'react';
import { Settings } from '../types';
import Modal from './common/Modal';
import { useAppContext } from '../App';
import { mockTestEmail } from '../services/mockApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Preferências">
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
    </Modal>
  );
};

export default SettingsModal;
