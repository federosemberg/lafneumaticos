// src/utils/helpers.js
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    return `http://localhost:3000/images/${imagePath}`;
}

function getPriceByType(row, clientType) {
    switch (clientType) {
        case 'Reventa A':
            return parseFloat(row.get('Reventa A')) || 0;
        case 'Reventa B':
            return parseFloat(row.get('Reventa B')) || 0;
        default:
            return parseFloat(row.get('Precio de Venta')) || 0;
    }
}

async function generateUniqueReference() {
    const date = new Date();
    const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RES-${dateStr}-${randomPart}`;
}

module.exports = {
    getImageUrl,
    getPriceByType,
    generateUniqueReference
};