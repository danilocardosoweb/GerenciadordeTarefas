import React, { useState } from 'react';

interface RegisterScreenProps {
  onRegister: (name: string, email: string, password: string) => Promise<boolean>;
  onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    setError('');
    const success = await onRegister(name, email, password);
    if (!success) {
      // Error is likely handled by parent via toast, but we can set a local one too
      setError('Não foi possível realizar o cadastro. Tente outro e-mail.');
      setIsLoading(false);
    }
    // On success, parent component handles login and redirect
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">
        Criar Conta
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300">
        Junte-se ao Gerenciador de Tarefas
      </p>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
          <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label htmlFor="email-register" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
          <input id="email-register" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label htmlFor="password-register" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
          <input id="password-register" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
          <input id="confirm-password" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        
        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
        
        <div>
          <button type="submit" disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
             {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : 'Cadastrar'}
          </button>
        </div>
      </form>
       <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Já tem uma conta?{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
