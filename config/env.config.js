// src/config/env.config.js
require('dotenv').config();

const config = {
    PORT: process.env.PORT || 3000,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ASSISTANT_ID: process.env.ASSISTANT_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    SPREADSHEET_ID: process.env.SPREADSHEET_ID,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
    AUTHORIZED_NUMBERS: process.env.AUTHORIZED_NUMBERS?.split(',') || [
        '3515917952',
        '3515160237'
    ]
};

// Verificar credenciales críticas
if (!config.GOOGLE_SERVICE_ACCOUNT_EMAIL || !config.GOOGLE_PRIVATE_KEY || !config.SPREADSHEET_ID) {
    console.error('Faltan credenciales de Google Sheets:');
    console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!config.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.error('GOOGLE_PRIVATE_KEY:', !!config.GOOGLE_PRIVATE_KEY);
    console.error('SPREADSHEET_ID:', !!config.SPREADSHEET_ID);
}

module.exports = config;