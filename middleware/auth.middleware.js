// src/middleware/auth.middleware.js
const { AUTHORIZED_NUMBERS } = require('../config/env.config');

class AuthMiddleware {
    validateRequest(req, res, next) {
        const phone = req.query.from || req.body.from;
        
        if (!phone) {
            return res.status(400).json({ error: 'Número de teléfono no proporcionado' });
        }

        const cleanPhone = phone.replace('@c.us', '').replace('549', '');
        
        if (!AUTHORIZED_NUMBERS.includes(cleanPhone)) {
            return res.status(403).json({ error: 'Número no autorizado' });
        }

        req.cleanPhone = cleanPhone;
        next();
    }

    validateWhatsAppNumber(phone) {
        const cleanPhone = phone.replace('@c.us', '').replace('549', '');
        return AUTHORIZED_NUMBERS.includes(cleanPhone);
    }
}

module.exports = new AuthMiddleware();