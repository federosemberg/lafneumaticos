// src/config/openai.config.js
const OpenAI = require('openai');
const { OPENAI_API_KEY } = require('./env.config');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const tools = [
    {
        type: "function",
        function: {
            name: "check_stock",
            description: "Consulta el stock disponible de un producto",
            parameters: {
                type: "object",
                properties: {
                    product: { type: "string", description: "Nombre del producto" },
                    size: { type: "string", description: "Medida o código del producto" }
                },
                required: ["product", "size"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_price",
            description: "Consulta el precio de un producto",
            parameters: {
                type: "object",
                properties: {
                    product: { type: "string", description: "Nombre del producto" },
                    size: { type: "string", description: "Medida o código del producto" }
                },
                required: ["product", "size"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "make_reservation",
            description: "Realiza una reserva de producto",
            parameters: {
                type: "object",
                properties: {
                    product: { type: "string", description: "Nombre del producto" },
                    size: { type: "string", description: "Medida o código del producto" },
                    quantity: { type: "number", description: "Cantidad a reservar" }
                },
                required: ["product", "size", "quantity"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "msearch",
            description: "Busca productos por nombre o medida",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Término de búsqueda" },
                    size: { type: "string", description: "Medida o código del producto (opcional)" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "cancel_reservation",
            description: "Cancela una reserva existente y devuelve el stock",
            parameters: {
                type: "object",
                properties: {
                    reference: {
                        type: "string",
                        description: "Código de referencia de la reserva (formato: RES-YYYYMMDD-XXXX)"
                    }
                },
                required: ["reference"]
            }
        }
    }
];

module.exports = { openai, tools };