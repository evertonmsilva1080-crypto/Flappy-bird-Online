const accessoryCatalog = require('../public/accessories.json')
    .sort((first, second) => first.price - second.price ||
        first.name.localeCompare(second.name, 'pt-BR'));

function findAccessory(accessoryId) {
    return accessoryCatalog.find((accessory) => accessory.id === accessoryId);
}

module.exports = { accessoryCatalog, findAccessory };
