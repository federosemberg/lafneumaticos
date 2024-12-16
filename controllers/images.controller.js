// src/controllers/images.controller.js
const { openai } = require('../config/openai.config');

class ImagesController {
    async getImage(req, res) {
        try {
            const response = await openai.files.content(req.params.file_id);
            const buffer = Buffer.from(await response.arrayBuffer());
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (error) {
            console.error('Error al obtener la imagen:', error);
            res.status(500).send('Error al obtener la imagen');
        }
    }
}

module.exports = new ImagesController();