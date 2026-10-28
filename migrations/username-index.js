const Usuario = require('../models/Usuario');
const { collation } = require('../models/nomeUsuario');

const usernameIndexOptions = {
    name: 'nome_1',
    unique: true,
    collation,
};

async function ensureCollectionExists() {
    const database = Usuario.db.db;
    const collectionName = Usuario.collection.collectionName;
    const exists = await database
        .listCollections({ name: collectionName }, { nameOnly: true })
        .hasNext();

    if (!exists) {
        try {
            await Usuario.createCollection();
        } catch (erro) {
            if (erro.code !== 48) throw erro;

            const collectionExists = await database
                .listCollections({ name: collectionName }, { nameOnly: true })
                .hasNext();
            if (!collectionExists) throw erro;
        }
    }
}

async function migrateUsernameIndex() {
    await ensureCollectionExists();
    const collection = Usuario.collection;
    const indexes = await collection.indexes();
    const emailIndexes = indexes.filter((index) =>
        Object.keys(index.key).length === 1 && index.key.email === 1);
    const nomeIndexes = indexes.filter((index) =>
        Object.keys(index.key).length === 1 && index.key.nome === 1);
    const validNomeIndex = nomeIndexes.find((index) =>
        index.unique &&
        index.collation?.locale === collation.locale &&
        index.collation?.strength === collation.strength);

    if (!validNomeIndex) {
        const nomesDuplicados = await collection.aggregate([
            {
                $group: {
                    _id: '$nome',
                    quantidade: { $sum: 1 },
                },
            },
            {
                $match: { quantidade: { $gt: 1 } },
            },
            { $limit: 1 },
        ], { collation }).toArray();

        if (nomesDuplicados.length) {
            throw new Error(
                'Há contas com nomes repetidos. Renomeie as contas duplicadas no MongoDB antes de habilitar o login por nome.'
            );
        }
    }

    for (const index of emailIndexes) {
        await collection.dropIndex(index.name);
    }

    if (validNomeIndex) return;

    for (const index of nomeIndexes) {
        await collection.dropIndex(index.name);
    }

    await collection.createIndex({ nome: 1 }, usernameIndexOptions);
}

module.exports = migrateUsernameIndex;
