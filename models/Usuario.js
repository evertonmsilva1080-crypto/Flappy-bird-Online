const mongoose = require('mongoose');
const { collation: nomeCollation } = require('./nomeUsuario');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 60,
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
}, {
    timestamps: true,
    versionKey: false,
    autoIndex: false,
});

usuarioSchema.index({ nome: 1 }, { unique: true, collation: nomeCollation });

module.exports = mongoose.model('Usuario', usuarioSchema);
