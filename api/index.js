import { put, list } from '@vercel/blob';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const BLOB_KEY = 'gerenciadortarefastecnoperfil-data.json';

// Middleware para verificar a variável de ambiente obrigatória.
// A SDK do Vercel Blob depende desta variável de ambiente.
app.use((req, res, next) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN environment variable not set.');
        return res.status(500).json({ message: 'Erro de configuração: O token de acesso ao armazenamento não está configurado no servidor.' });
    }
    next();
});


// GET endpoint to retrieve data
app.get('/api/data', async (req, res) => {
    try {
        const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
        if (blobs.length === 0 || !blobs[0].url) {
            return res.status(404).json({ message: 'No data found.' });
        }
        const blobUrl = blobs[0].url;
        const response = await fetch(blobUrl);
        if (!response.ok) {
           throw new Error(`Failed to fetch blob data: ${response.statusText}`);
        }
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch data from blob storage.' });
    }
});

// POST endpoint to save data
app.post('/api/data', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'No data provided in request body.' });
        }
        const blob = await put(BLOB_KEY, JSON.stringify(data), {
            access: 'public',
            contentType: 'application/json',
        });
        res.status(200).json({ message: 'Data saved successfully.', url: blob.url });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Failed to save data to blob storage.' });
    }
});

export default app;
