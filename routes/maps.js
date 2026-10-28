const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const mapsDirectory = path.join(__dirname, '..', 'public', 'maps');
const knownNames = { classic: 'Clássico', city: 'Cidade', night: 'Noturno' };
const defaultOrder = { classic: 0, city: 1, night: 2 };

function displayName(id) {
    return knownNames[id] || id
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

router.get('/', async (req, res) => {
    const entries = await fs.readdir(mapsDirectory, { withFileTypes: true });
    const maps = entries
        .filter((entry) => entry.isFile() && /^[a-z0-9][a-z0-9_-]*\.png$/.test(entry.name))
        .map((entry) => {
            const id = path.basename(entry.name, '.png');
            return { id, name: displayName(id), imageUrl: `/maps/${entry.name}` };
        })
        .sort((a, b) => {
            const orderDifference = (defaultOrder[a.id] ?? 3) - (defaultOrder[b.id] ?? 3);
            return orderDifference || a.id.localeCompare(b.id);
        });

    res.set('Cache-Control', 'no-store').json(maps);
});

module.exports = router;
