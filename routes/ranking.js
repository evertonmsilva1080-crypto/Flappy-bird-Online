const express = require('express');
const Usuario = require('../models/Usuario');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const usuarios = await Usuario.find({})
            .select('nome pontuacaoMaxima -_id')
            .sort({ pontuacaoMaxima: -1, nome: 1 })
            .lean();
        return res.json({
            ranking: usuarios.map((usuario) => ({
                nome: usuario.nome,
                pontuacao: usuario.pontuacaoMaxima || 0,
            })),
        });
    } catch (erro) {
        console.error('Erro ao consultar ranking:', erro);
        return res.status(500).json({ message: 'Não foi possível carregar o ranking agora.' });
    }
});

module.exports = router;
