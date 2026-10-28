require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const path = require('path');
const migrateUsernameIndex = require('./migrations/username-index');
const app = express();
const port = Number(process.env.PORT) || 8000;
let conexaoMongo;
let migracaoNomes;

async function conectarBanco() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Configure MONGODB_URI nas variáveis de ambiente.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres nas variáveis de ambiente.');
    }
    if (mongoose.connection.readyState === 1) return;

    if (!conexaoMongo) {
        conexaoMongo = mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log('Conectado ao MongoDB.'))
            .finally(() => {
                conexaoMongo = null;
            });
    }
    await conexaoMongo;
}

async function prepararBanco() {
    await conectarBanco();
    if (!migracaoNomes) {
        migracaoNomes = migrateUsernameIndex().catch((erro) => {
            migracaoNomes = null;
            throw erro;
        });
    }
    await migracaoNomes;
}

app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
    res.on('finish', () => {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode}`);
    });
    next();
});
app.use(express.json({ limit: '10kb' }));
app.get('/api/maps', async (req, res) => {
    const mapsDirectory = path.join(__dirname, 'public', 'maps');
    const entries = await fs.readdir(mapsDirectory, { withFileTypes: true });
    const maps = entries
        .filter((entry) => entry.isFile() && /^[a-z0-9][a-z0-9_-]*\.png$/.test(entry.name))
        .map((entry) => {
            const id = path.basename(entry.name, '.png');
            const knownNames = {
                classic: 'Clássico',
                city: 'Cidade',
                night: 'Noturno',
            };
            const name = knownNames[id] || id
                .split(/[-_]/)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
            return { id, name, imageUrl: `/maps/${entry.name}` };
        })
        .sort((a, b) => {
            const defaultOrder = { classic: 0, city: 1, night: 2 };
            const aOrder = defaultOrder[a.id] ?? 3;
            const bOrder = defaultOrder[b.id] ?? 3;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.id.localeCompare(b.id);
        });

    res.set('Cache-Control', 'no-store').json(maps);
});
app.use('/api', async (req, res, next) => {
    await prepararBanco();
    next();
});
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api/auth', require('./routes/auth'));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (req, res) => {
    res.json({ ok: true, database: mongoose.connection.readyState === 1 });
});
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Rota da API não encontrada.' });
});
app.use((erro, req, res, next) => {
    console.error('Erro não tratado na API:', erro);
    if (res.headersSent) return next(erro);
    const status = Number.isInteger(erro.status) ? erro.status : 500;
    const message = status < 500
        ? erro.message
        : 'Erro interno da API. Confira o terminal do servidor.';
    return res.status(status).json({ message });
});

async function iniciarServidor() {
    await prepararBanco();
    app.listen(port, () => {
        console.log('Flappy Bird disponível em http://localhost:' + port);
    });
}

if (require.main === module) {
    iniciarServidor().catch((erro) => {
        console.error('Não foi possível iniciar o servidor:', erro.message);
        process.exitCode = 1;
    });
}

module.exports = app;
