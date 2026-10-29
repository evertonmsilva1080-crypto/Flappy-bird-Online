const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { collation: nomeCollation } = require('../models/nomeUsuario');
const { findSkin, skinCatalog } = require('../config/skins');
const { accessoryCatalog, findAccessory } = require('../config/accessories');
const { effectCatalog, findEffect } = require('../config/effects');

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
        skins: Array.isArray(usuario.skins) ? usuario.skins : ['classic'],
        skinEquipped: usuario.skinEquipped || 'classic',
        accessories: Array.isArray(usuario.accessories) ? usuario.accessories : [],
        accessoryEquipped: usuario.accessoryEquipped || 'none',
        effects: Array.isArray(usuario.effects) ? usuario.effects : ['effect-white'],
        effectEquipped: usuario.effectEquipped || 'effect-white',
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

    if (nome.length < 2 || nome.length > 15) {
        return res.status(400).json({ message: 'Informe um nome entre 2 e 15 caracteres.' });
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

router.post('/profile/name', autenticar, async (req, res) => {
      const nome = String(req.body?.nome || '').trim();
      if (nome.length < 2 || nome.length > 15) {
          return res.status(400).json({ message: 'Informe um nome entre 2 e 15 caracteres.' });
      }

      try {
          const nomeEmUso = await Usuario.exists({
              nome,
              _id: { $ne: req.usuarioId },
          }).collation(nomeCollation);
          if (nomeEmUso) {
              return res.status(409).json({ message: 'Este nome já está em uso. Escolha outro.' });
          }

          const usuario = await Usuario.findByIdAndUpdate(
              req.usuarioId,
              { $set: { nome } },
              { new: true, runValidators: true }
          );
          if (!usuario) return res.status(404).json({ message: 'Conta não encontrada.' });
          return res.json({ usuario: dadosPublicos(usuario) });
      } catch (erro) {
          if (erro.code === 11000) {
              return res.status(409).json({ message: 'Este nome já está em uso. Escolha outro.' });
          }
          if (erro.name === 'ValidationError') {
              return res.status(400).json({ message: 'Confira o nome informado.' });
          }
          console.error('Erro ao atualizar nome do usuário:', erro);
          return res.status(500).json({ message: 'Não foi possível atualizar o nome agora.' });
      }
});

router.get('/skins', (req, res) => {
    return res.json({ skins: skinCatalog });
});

router.post('/skins/purchase', autenticar, async (req, res) => {
    const skin = findSkin(req.body?.skinId);
    if (!skin) {
        return res.status(400).json({ message: 'Skin inválida.' });
    }

    try {
        const usuario = await Usuario.findOneAndUpdate(
            {
                _id: req.usuarioId,
                moedas: { $gte: skin.price },
                skins: { $ne: skin.id },
            },
            {
                $inc: { moedas: -skin.price },
                $addToSet: { skins: { $each: ['classic', skin.id] } },
            },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        if (conta.skins?.includes(skin.id)) {
            return res.status(409).json({ message: 'Você já possui esta skin.' });
        }
        return res.status(400).json({ message: 'Moedas insuficientes para comprar esta skin.' });
    } catch (erro) {
        console.error('Erro ao comprar skin:', erro);
        return res.status(500).json({ message: 'Não foi possível comprar a skin.' });
    }
});

router.post('/skins/equip', autenticar, async (req, res) => {
    const skinId = req.body?.skinId;
    const skin = skinId === 'classic' ? { id: 'classic' } : findSkin(skinId);
    if (!skin) {
        return res.status(400).json({ message: 'Skin inválida.' });
    }

    try {
        const filter = { _id: req.usuarioId };
        if (skin.id !== 'classic') filter.skins = skin.id;

        const usuario = await Usuario.findOneAndUpdate(
            filter,
            {
                $set: { skinEquipped: skin.id },
                $addToSet: { skins: 'classic' },
            },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        return res.status(403).json({ message: 'Compre esta skin antes de equipá-la.' });
    } catch (erro) {
        console.error('Erro ao equipar skin:', erro);
        return res.status(500).json({ message: 'Não foi possível equipar a skin.' });
    }
});

router.get('/accessories', (req, res) => {
    return res.json({ accessories: accessoryCatalog });
});

router.post('/accessories/purchase', autenticar, async (req, res) => {
    const accessory = findAccessory(req.body?.accessoryId);
    if (!accessory) {
        return res.status(400).json({ message: 'Acessório inválido.' });
    }

    try {
        const usuario = await Usuario.findOneAndUpdate(
            {
                _id: req.usuarioId,
                moedas: { $gte: accessory.price },
                accessories: { $ne: accessory.id },
            },
            {
                $inc: { moedas: -accessory.price },
                $addToSet: { accessories: accessory.id },
            },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        if (conta.accessories?.includes(accessory.id)) {
            return res.status(409).json({ message: 'Você já possui este acessório.' });
        }
        return res.status(400).json({ message: 'Moedas insuficientes para comprar este acessório.' });
    } catch (erro) {
        console.error('Erro ao comprar acessório:', erro);
        return res.status(500).json({ message: 'Não foi possível comprar o acessório.' });
    }
});

router.post('/accessories/equip', autenticar, async (req, res) => {
    const accessoryId = req.body?.accessoryId;
    if (accessoryId !== 'none' && !findAccessory(accessoryId)) {
        return res.status(400).json({ message: 'Acessório inválido.' });
    }

    try {
        const filter = { _id: req.usuarioId };
        if (accessoryId !== 'none') filter.accessories = accessoryId;

        const usuario = await Usuario.findOneAndUpdate(
            filter,
            { $set: { accessoryEquipped: accessoryId } },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        return res.status(403).json({ message: 'Compre este acessório antes de equipá-lo.' });
    } catch (erro) {
        console.error('Erro ao equipar acessório:', erro);
        return res.status(500).json({ message: 'Não foi possível equipar o acessório.' });
    }
});

router.get('/effects', (req, res) => {
    return res.json({ effects: effectCatalog });
});

router.post('/effects/purchase', autenticar, async (req, res) => {
    const effect = findEffect(req.body?.effectId);
    if (!effect) {
        return res.status(400).json({ message: 'Efeito inválido.' });
    }
    if (effect.price === 0) {
        return res.status(400).json({ message: 'Este efeito é gratuito e não precisa ser comprado.' });
    }

    try {
        const usuario = await Usuario.findOneAndUpdate(
            {
                _id: req.usuarioId,
                moedas: { $gte: effect.price },
                effects: { $ne: effect.id },
            },
            {
                $inc: { moedas: -effect.price },
                $addToSet: { effects: { $each: ['effect-white', effect.id] } },
            },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        if (conta.effects?.includes(effect.id)) {
            return res.status(409).json({ message: 'Você já possui este efeito.' });
        }
        return res.status(400).json({ message: 'Moedas insuficientes para comprar este efeito.' });
    } catch (erro) {
        console.error('Erro ao comprar efeito:', erro);
        return res.status(500).json({ message: 'Não foi possível comprar o efeito.' });
    }
});

router.post('/effects/equip', autenticar, async (req, res) => {
    const effectId = req.body?.effectId;
    const effect = findEffect(effectId);
    if (!effect) {
        return res.status(400).json({ message: 'Efeito inválido.' });
    }

    try {
        const filter = { _id: req.usuarioId };
        if (effect.price > 0) filter.effects = effect.id;

        const usuario = await Usuario.findOneAndUpdate(
            filter,
            {
                $set: { effectEquipped: effect.id },
                $addToSet: { effects: 'effect-white' },
            },
            { new: true, runValidators: true }
        );
        if (usuario) return res.json({ usuario: dadosPublicos(usuario) });

        const conta = await Usuario.findById(req.usuarioId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        return res.status(403).json({ message: 'Compre este efeito antes de equipá-lo.' });
    } catch (erro) {
        console.error('Erro ao equipar efeito:', erro);
        return res.status(500).json({ message: 'Não foi possível equipar o efeito.' });
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
        const jogadoresAcima = await Usuario.countDocuments({
            $or: [
                { pontuacaoMaxima: { $gt: usuario.pontuacaoMaxima } },
                {
                    pontuacaoMaxima: usuario.pontuacaoMaxima,
                    nome: { $lt: usuario.nome },
                },
            ],
        }).collation(nomeCollation);
        return res.json({
            usuario: dadosPublicos(usuario),
            posicaoRanking: jogadoresAcima + 1,
        });
    } catch (erro) {
        console.error('Erro ao salvar resultado da partida:', erro);
        return res.status(500).json({ message: 'Não foi possível salvar o resultado.' });
    }
});

module.exports = router;
