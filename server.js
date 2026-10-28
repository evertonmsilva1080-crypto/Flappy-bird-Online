require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
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
app.use('/api/auth', require('./routes/auth'));
app.use(express.static(__dirname));
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
    if (!process.env.MONGODB_URI) {
        throw new Error('Configure MONGODB_URI no arquivo .env antes de iniciar.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres no arquivo .env.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB.');
    app.listen(port, () => {
        console.log('Flappy Bird disponível em http://localhost:' + port);
    });
}

iniciarServidor().catch((erro) => {
    console.error('Não foi possível iniciar o servidor:', erro.message);
    process.exitCode = 1;
});
