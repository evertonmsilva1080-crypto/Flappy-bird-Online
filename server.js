require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { prepareDatabase } = require('./config/database');
const requireDatabase = require('./middleware/prepareDatabase');
const app = express();
const port = Number(process.env.PORT) || 8000;

app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
    res.on('finish', () => {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode}`);
    });
    next();
});
app.use(express.json({ limit: '10kb' }));
app.use('/api/maps', require('./routes/maps'));
app.use('/api', requireDatabase);
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
    await prepareDatabase();
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
