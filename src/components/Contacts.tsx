import React, { useState } from 'react';
import { Contact } from '../types';
import Modal from './common/Modal';
import { useAppContext } from '../App';

const ContactForm: React.FC<{ contact: Contact | null; onClose: () => void }> = ({ contact, onClose }) => {
    const { setContacts, addToast } = useAppContext();
    const [formData, setFormData] = useState<Omit<Contact, 'id'>>(contact || {
      name: '', email: '', phone: '', company: '', role: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (contact) {
                const response = await fetch(`/api/contacts/${contact.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if(!response.ok) throw new Error("Failed to update contact");
                const updatedContact = await response.json();
                setContacts(prev => prev.map(c => (c.id === contact.id ? updatedContact : c)));
                addToast('Contato atualizado!', 'success');
            } else {
                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if(!response.ok) throw new Error("Failed to create contact");
                const newContact = await response.json();
                setContacts(prev => [newContact, ...prev]);
                addToast('Contato adicionado!', 'success');
            }
            onClose();
        } catch(err) {
            console.error(err);
            addToast('Erro ao salvar contato.', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefone" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input name="company" value={formData.company} onChange={handleChange} placeholder="Empresa" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input name="role" value={formData.role} onChange={handleChange} placeholder="Cargo" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar</button>
            </div>
        </form>
    );
};

const ContactsPage: React.FC = () => {
    const { contacts, setContacts, addToast } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const handleEdit = (contact: Contact) => {
      setSelectedContact(contact);
      setModalOpen(true);
    };
    
    const handleAdd = () => {
      setSelectedContact(null);
      setModalOpen(true);
    };
  
    const handleDelete = async (contactId: string) => {
      if (window.confirm("Tem certeza? Excluir um contato irá removê-lo de todas as tarefas associadas (esta ação é permanente no banco de dados).")) {
        try {
            const response = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
            if(!response.ok) throw new Error("Failed to delete contact");
            setContacts(prev => prev.filter(c => c.id !== contactId));
            addToast('Contato excluído!', 'success');
        } catch(err) {
            addToast('Erro ao excluir contato. Ele pode estar sendo usado.', 'error');
        }
      }
    };
    
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Contatos</h1>
                <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
                  Adicionar Contato
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {contacts.map(contact => (
                            <tr key={contact.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                                                {getInitials(contact.name)}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contact.company}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contact.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(contact)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedContact ? 'Editar Contato' : 'Novo Contato'}>
                    <ContactForm contact={selectedContact} onClose={() => setModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default ContactsPage;
