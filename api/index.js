import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createSupabaseClient } from './supabaseClient.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Middleware to check for Supabase config
app.use((req, res, next) => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables not set.');
        return res.status(500).json({ message: 'Erro de configuração do servidor.' });
    }
    next();
});

// --- AUTH ENDPOINTS ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
        .from('gt_users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: In a real app, use hashed passwords!
        .single();

    if (error || !data) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    res.status(200).json(data);
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('gt_users')
        .insert({ name, email, password, role: 'Membro' })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: 'E-mail já cadastrado.' });
        }
        return res.status(500).json({ message: 'Erro ao criar usuário.', error });
    }
    res.status(201).json(data);
});

// --- DATA FETCHING ENDPOINT ---
app.get('/api/app-data/:userId', async (req, res) => {
    const { userId } = req.params;
    const supabase = createSupabaseClient();

    try {
        // 1. Get current user and their role
        const { data: currentUser, error: userError } = await supabase
            .from('gt_users')
            .select('id, name, email, role')
            .eq('id', userId)
            .single();

        if (userError || !currentUser) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // 2. Fetch all peripheral data
        const [usersRes, contactsRes, groupsRes] = await Promise.all([
            supabase.from('gt_users').select('id, name, email, role'),
            supabase.from('gt_contacts').select('*'),
            supabase.from('gt_groups').select('*, memberIds:gt_group_members(user_id)')
        ]);
        
        if (usersRes.error || contactsRes.error || groupsRes.error) {
            throw new Error('Failed to fetch peripheral data');
        }

        const formattedGroups = groupsRes.data.map(g => ({ ...g, memberIds: g.memberIds.map(m => m.user_id) }));
        
        // 3. Fetch tasks based on user permissions
        let taskQuery = supabase.from('gt_tasks').select('*, participants:gt_task_participants(contact_id), history:gt_task_history(*)');

        if (currentUser.role !== 'Admin') {
            const userGroupIds = formattedGroups
                .filter(g => g.memberIds.includes(userId))
                .map(g => g.id);

            const orConditions = [
                'visibility.eq.Pública',
                `creator_id.eq.${userId}`,
                `group_id.in.(${userGroupIds.join(',') || "''"})`
            ].join(',');
            
            taskQuery = taskQuery.or(orConditions);
        }

        const { data: tasksData, error: tasksError } = await taskQuery;

        if (tasksError) throw tasksError;
        
        const formattedTasks = tasksData.map(t => ({...t, participants: t.participants.map(p => p.contact_id) }));

        res.status(200).json({
            users: usersRes.data,
            contacts: contactsRes.data,
            groups: formattedGroups,
            tasks: formattedTasks,
            // Alerts are now managed client-side based on task data
            alerts: [], 
            settings: { language: 'pt', dateFormat: 'DD/MM/YYYY', timezone: 'America/Sao_Paulo', backendUrl: '' }
        });

    } catch (error) {
        console.error("Error fetching app data:", error);
        res.status(500).json({ message: "Erro ao buscar dados da aplicação.", error });
    }
});


// --- GENERIC CRUD ---
const handleRequest = async (res, query) => {
    const { data, error } = await query;
    if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ message: "Database error", error });
    }
    res.status(200).json(data);
};

// Tasks
app.post('/api/tasks', async (req, res) => {
    const { participants, history, ...taskData } = req.body;
    const supabase = createSupabaseClient();
    const { data: newTask, error } = await supabase.from('gt_tasks').insert(taskData).select().single();
    if(error) return res.status(500).json({error});
    
    if (participants && participants.length > 0) {
        const participantLinks = participants.map(contact_id => ({ task_id: newTask.id, contact_id }));
        await supabase.from('gt_task_participants').insert(participantLinks);
    }
    // Add initial history
     await supabase.from('gt_task_history').insert({ task_id: newTask.id, user: history[0].user, change: history[0].change });

    res.status(201).json({ ...newTask, participants, history });
});
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { participants, history, ...taskData } = req.body;
    const supabase = createSupabaseClient();

    const { data: updatedTask, error } = await supabase.from('gt_tasks').update(taskData).eq('id', id).select().single();
     if(error) return res.status(500).json({error});

    // Sync participants
    await supabase.from('gt_task_participants').delete().eq('task_id', id);
    if (participants && participants.length > 0) {
        const participantLinks = participants.map(contact_id => ({ task_id: id, contact_id }));
        await supabase.from('gt_task_participants').insert(participantLinks);
    }
    // Add new history entries
    if(history && history.length > 0) {
         await supabase.from('gt_task_history').insert({ task_id: id, user: history[0].user, change: history[0].change });
    }
    
    res.status(200).json({ ...updatedTask, participants });
});
app.delete('/api/tasks/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_tasks').delete().eq('id', req.params.id)));

// Contacts
app.post('/api/contacts', (req, res) => handleRequest(res, createSupabaseClient().from('gt_contacts').insert(req.body).select().single()));
app.put('/api/contacts/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_contacts').update(req.body).eq('id', req.params.id).select().single()));
app.delete('/api/contacts/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_contacts').delete().eq('id', req.params.id)));

// Users (management)
app.put('/api/users/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_users').update(req.body).eq('id', req.params.id).select('id,name,email,role').single()));
app.delete('/api/users/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_users').delete().eq('id', req.params.id)));
app.post('/api/users/invite', (req, res) => handleRequest(res, createSupabaseClient().from('gt_users').insert(req.body).select('id,name,email,role').single()));


// Groups
app.post('/api/groups', (req, res) => handleRequest(res, createSupabaseClient().from('gt_groups').insert(req.body).select().single()));
app.delete('/api/groups/:id', (req, res) => handleRequest(res, createSupabaseClient().from('gt_groups').delete().eq('id', req.params.id)));
app.post('/api/groups/members', async (req, res) => {
    const { group_id, memberIds } = req.body;
    const supabase = createSupabaseClient();
    // Clear existing members and re-insert
    await supabase.from('gt_group_members').delete().eq('group_id', group_id);
    if(memberIds && memberIds.length > 0) {
        const memberLinks = memberIds.map(user_id => ({ group_id, user_id }));
        await handleRequest(res, supabase.from('gt_group_members').insert(memberLinks));
    } else {
        res.status(200).json([]);
    }
});


export default app;
