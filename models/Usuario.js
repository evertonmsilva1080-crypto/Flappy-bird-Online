const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 60,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
        unique: true,
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
});

module.exports = mongoose.model('Usuario', usuarioSchema);
