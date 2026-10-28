const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { collation: nomeCollation } = require('../models/nomeUsuario');

const router = express.Router();

function criarToken(usuario) {
    return jwt.sign({ sub: String(usuario._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function dadosPublicos(usuario) {
    return {
        id: String(usuario._id),
        nome: usuario.nome,
        pontuacaoMaxima: usuario.pontuacaoMaxima || 0,
        moedas: usuario.moedas || 0,
    };
}

function autenticar(req, res, next) {
    const [tipo, token] = (req.get('authorization') || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Faça login para continuar.' });
    }

    try {
        req.usuarioId = jwt.verify(token, process.env.JWT_SECRET).sub;
        return next();
    } catch {
        return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
    }
}

router.post('/register', async (req, res) => {
    const nome = String(req.body?.nome || '').trim();
    const senha = String(req.body?.senha || '');

    if (nome.length < 2 || nome.length > 60) {
        return res.status(400).json({ message: 'Informe um nome entre 2 e 60 caracteres.' });
    }
    if (senha.length < 8 || senha.length > 72) {
        return res.status(400).json({ message: 'A senha deve ter entre 8 e 72 caracteres.' });
    }

    try {
        const nomeEmUso = await Usuario.exists({ nome }).collation(nomeCollation);
        if (nomeEmUso) {
            return res.status(409).json({ message: 'Este nome já está em uso. Escolha outro.' });
        }

        const senhaHash = await bcrypt.hash(senha, 12);
        const usuario = await Usuario.create({ nome, senhaHash });
        return res.status(201).json({
            usuario: dadosPublicos(usuario),
            token: criarToken(usuario),
        });
    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({ message: 'Este nome já está em uso. Escolha outro.' });
        }
        if (erro.name === 'ValidationError') {
            return res.status(400).json({ message: 'Confira os dados informados.' });
        }
        console.error('Erro ao criar usuário:', erro);
        return res.status(500).json({ message: 'Não foi possível criar a conta agora.' });
    }
});

router.post('/login', async (req, res) => {
    const nome = String(req.body?.nome || '').trim();
    const senha = String(req.body?.senha || '');

    try {
        const usuario = await Usuario.findOne({ nome })
            .collation(nomeCollation)
            .select('+senhaHash');
        if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
            return res.status(401).json({ message: 'Nome ou senha incorretos.' });
        }
        return res.json({
            usuario: dadosPublicos(usuario),
            token: criarToken(usuario),
        });
    } catch (erro) {
        console.error('Erro ao entrar:', erro);
        return res.status(500).json({ message: 'Não foi possível entrar agora.' });
    }
});

router.get('/me', autenticar, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuarioId);
        if (!usuario) {
            return res.status(401).json({ message: 'Conta não encontrada.' });
        }
        return res.json({ usuario: dadosPublicos(usuario) });
    } catch (erro) {
        console.error('Erro ao consultar usuário:', erro);
        return res.status(500).json({ message: 'Não foi possível consultar a conta.' });
    }
});

router.post('/game-result', autenticar, async (req, res) => {
    const pontuacao = Number(req.body?.pontuacao);
    const moedas = Number(req.body?.moedas);

    if (!Number.isSafeInteger(pontuacao) || pontuacao < 0 || pontuacao > 1000000) {
        return res.status(400).json({ message: 'Pontuação inválida.' });
    }
    if (!Number.isSafeInteger(moedas) || moedas < 0 || moedas > 100) {
        return res.status(400).json({ message: 'Quantidade de moedas inválida.' });
    }

    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.usuarioId,
            { $max: { pontuacaoMaxima: pontuacao }, $inc: { moedas } },
            { new: true, runValidators: true }
        );
        if (!usuario) return res.status(404).json({ message: 'Conta não encontrada.' });
        return res.json({ usuario: dadosPublicos(usuario) });
    } catch (erro) {
        console.error('Erro ao salvar resultado da partida:', erro);
        return res.status(500).json({ message: 'Não foi possível salvar o resultado.' });
    }
});

module.exports = router;
