const skinNames = [
    ['Amarelo', 'Vermelho', 'Laranja'],
    ['Verde', 'Azul', 'Roxo'],
    ['Rosa', 'Ciano', 'Magenta'],
    ['Azul-marinho', 'Turquesa', 'Lima'],
    ['Arco-íris', 'Lilás', 'Coral'],
    ['Cinza', 'Grafite', 'Branco'],
    ['Marrom', 'Bege', 'Dourado'],
];

const skinPrices = {
    Amarelo: 50,
    Vermelho: 50,
    Azul: 50,
    Laranja: 75,
    Verde: 75,
    Roxo: 75,
};

const skinCatalog = skinNames.flatMap((row, rowIndex) => row.map((name, variantIndex) => {
    const index = rowIndex * row.length + variantIndex;
    return {
        id: `skin-${rowIndex}-${variantIndex}`,
        name,
        price: skinPrices[name] ?? 0 + index * 10,
        row: rowIndex,
        variant: variantIndex,
    };
})).sort((first, second) => first.price - second.price || first.name.localeCompare(second.name, 'pt-BR'));

function findSkin(skinId) {
    return skinCatalog.find((skin) => skin.id === skinId);
}

module.exports = { findSkin, skinCatalog };
