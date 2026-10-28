const mongoose = require('mongoose');
const migrateUsernameIndex = require('../migrations/username-index');

let connectionPromise;
let migrationPromise;

async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Configure MONGODB_URI nas variáveis de ambiente.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres nas variáveis de ambiente.');
    }
    if (mongoose.connection.readyState === 1) return;

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log('Conectado ao MongoDB.'))
            .finally(() => { connectionPromise = null; });
    }
    await connectionPromise;
}

async function prepareDatabase() {
    await connectDatabase();
    if (!migrationPromise) {
        migrationPromise = migrateUsernameIndex().catch((error) => {
            migrationPromise = null;
            throw error;
        });
    }
    await migrationPromise;
}

module.exports = { connectDatabase, prepareDatabase };
