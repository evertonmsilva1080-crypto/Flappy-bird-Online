const effectCatalog = require('../public/effects.json')
    .sort((first, second) => first.price - second.price ||
        first.name.localeCompare(second.name, 'pt-BR'));

function findEffect(effectId) {
    return effectCatalog.find((effect) => effect.id === effectId);
}

module.exports = { effectCatalog, findEffect };
