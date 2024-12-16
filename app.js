// src/app.js (actualizado)
const express = require('express');
const cors = require('cors');
const { PORT, CORS_ORIGIN } = require('./config/env.config');
const googleSheets = require('./services/googleSheets.service');
const whatsapp = require('./services/whatsapp.service');
const chatRoutes = require('./routes/chat.routes');
const imagesRoutes = require('./routes/images.routes'); // Nueva importación
const chatController = require('./controllers/chat.controller');
const authMiddleware = require('./middleware/auth.middleware'); // Nueva importación

const app = express();

// Middlewares
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Aplicar middleware de autenticación a todas las rutas
app.use(authMiddleware.validateRequest);

// Rutas
app.use('/chat', chatRoutes);
app.use('/images', imagesRoutes); // Nueva ruta

// Configurar el manejador de mensajes de WhatsApp
whatsapp.client.on('message', async (message) => {
    try {
        const from = message.from.replace('@c.us', '').replace('549', '');
        
        if (!authMiddleware.validateWhatsAppNumber(from)) {
            console.log('Número no autorizado:', from);
            return;
        }

        const processedContent = await chatController.processMessage(from, message.body);

        for (const content of processedContent) {
            await whatsapp.sendMessage(message.from, content);
        }
    } catch (error) {
        console.error('Error al procesar mensaje de WhatsApp:', error);
        await whatsapp.sendMessage(message.from, {
            type: 'text',
            content: 'Lo siento, hubo un error al procesar tu mensaje.'
        });
    }
});

async function startServer() {
    try {
        await googleSheets.initialize();
        //whatsapp.initialize();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();