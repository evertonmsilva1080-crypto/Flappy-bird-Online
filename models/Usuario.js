const mongoose = require('mongoose');
const { collation: nomeCollation } = require('./nomeUsuario');
const { skinCatalog } = require('../config/skins');
const { accessoryCatalog } = require('../config/accessories');
const { effectCatalog } = require('../config/effects');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 15,
    },
    senhaHash: {
        type: String,
        required: true,
        select: false,
    },
    pontuacaoMaxima: {
        type: Number,
        default: 0,
        min: 0,
    },
    moedas: {
        type: Number,
        default: 0,
        min: 0,
    },
    skins: {
        type: [String],
        enum: ['classic', ...skinCatalog.map((skin) => skin.id)],
        default: ['classic'],
    },
    skinEquipped: {
        type: String,
        enum: ['classic', ...skinCatalog.map((skin) => skin.id)],
        default: 'classic',
    },
    accessories: {
        type: [String],
        enum: accessoryCatalog.map((accessory) => accessory.id),
        default: [],
    },
    accessoryEquipped: {
        type: String,
        enum: ['none', ...accessoryCatalog.map((accessory) => accessory.id)],
        default: 'none',
    },
    effects: {
        type: [String],
        enum: effectCatalog.map((effect) => effect.id),
        default: ['effect-white'],
    },
    effectEquipped: {
        type: String,
        enum: effectCatalog.map((effect) => effect.id),
        default: 'effect-white',
    },
}, {
    timestamps: true,
    versionKey: false,
    autoIndex: false,
});

usuarioSchema.index({ nome: 1 }, { unique: true, collation: nomeCollation });

module.exports = mongoose.model('Usuario', usuarioSchema);
