const { prepareDatabase } = require('../config/database');

async function requireDatabase(req, res, next) {
    await prepareDatabase();
    next();
}

module.exports = requireDatabase;
