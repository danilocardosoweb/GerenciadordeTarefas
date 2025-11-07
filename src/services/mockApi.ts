import { Task, Contact } from '../types';

interface InvitePayload {
  task: Task;
  responsible: Contact | null;
  contacts: Contact[];
  subject: string;
  message: string;
}

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const mockSendInvite = async (payload: InvitePayload): Promise<{ success: boolean; message: string }> => {
  await delay(1500);
  console.log("--- MOCK API: Enviando Convite ---");
  console.log("Payload:", payload);

  // Simulate potential failure
  if (payload.task.name.toLowerCase().includes('fail')) {
    console.log("--- MOCK API: Falha simulada ---");
    return { success: false, message: 'Erro simulado no servidor: O convite não pôde ser enviado.' };
  }

  console.log("--- MOCK API: Convite enviado com sucesso ---");
  return { success: true, message: 'Convite ICS enviado com sucesso por e-mail.' };
};

export const mockTestEmail = async (backendUrl: string): Promise<{ success: boolean; message: string }> => {
  await delay(1000);
  console.log("--- MOCK API: Testando conexão SMTP ---");
  console.log("URL do Backend:", backendUrl);
  
  if (backendUrl.includes('invalid')) {
     console.log("--- MOCK API: Teste de e-mail falhou ---");
     return { success: false, message: 'Falha ao conectar ao servidor SMTP. Verifique suas credenciais e a URL.' };
  }
  
  console.log("--- MOCK API: Teste de e-mail bem-sucedido ---");
  return { success: true, message: 'Conexão SMTP estabelecida com sucesso.' };
}
