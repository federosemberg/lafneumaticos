// src/services/whatsapp.service.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { AUTHORIZED_NUMBERS } = require('../config/env.config');

class WhatsAppService {
constructor() {
    this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { args: ['--no-sandbox'] }
    });

    this.initializeEventHandlers();
}

initializeEventHandlers() {
    this.client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('Escanea el código QR con WhatsApp');
    });

    this.client.on('ready', () => {
        console.log('Cliente WhatsApp conectado');
    });
}

async sendMessage(to, content) {
    try {
        if (content.type === 'text') {
            await this.client.sendMessage(to, content.content);
        } else if (content.type === 'image' && content.content) {
            try {
                const media = await MessageMedia.fromUrl(content.content);
                await this.client.sendMessage(to, media, {
                    caption: content.alt || ''
                });
            } catch (imageError) {
                console.error('Error al enviar imagen:', imageError);
                await this.client.sendMessage(to, `No se pudo enviar la imagen. URL: ${content.content}`);
            }
        }
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        throw error;
    }
}

initialize() {
    this.client.initialize();
}
}

module.exports = new WhatsAppService();