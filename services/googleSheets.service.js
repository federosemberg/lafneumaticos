// src/services/googleSheets.service.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = require('../config/env.config');
const { getImageUrl, getPriceByType, generateUniqueReference } = require('../utils/helpers');
const Product = require('../models/product.model');
const Reservation = require('../models/reservation.model');
const User = require('../models/user.model');

class GoogleSheetsService {
    constructor() {
        this.doc = null;
    }

    async initialize() {
        try {
            if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
                throw new Error('Faltan credenciales de Google Sheets en las variables de entorno');
            }

            console.log('Inicializando Google Sheets...');

            // Limpiar y formatear la clave privada
            const privateKey = GOOGLE_PRIVATE_KEY
                .replace(/\\n/g, '\n')
                .replace(/"/g, '')
                .trim();

            // Crear el documento y autenticar en un solo paso
            this.doc = new GoogleSpreadsheet(SPREADSHEET_ID, new JWT({
                email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            }));

            // Cargar información
            await this.doc.loadInfo();
            console.log('Google Sheets inicializado correctamente');
            console.log('Título del documento:', this.doc.title);

        } catch (error) {
            console.error('Error detallado al inicializar Google Sheets:');
            console.error('Error completo:', error);
            throw error;
        }
    }

    async checkUserExists(phone) {
        try {
            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle['Clientes'];
            const rows = await sheet.getRows();

            const phoneColumn = sheet.headerValues.find(header => header.toLowerCase() === 'celular');
            if (!phoneColumn) {
                console.error("La columna 'Celular' no fue encontrada.");
                return null;
            }

            const userRow = rows.find(row => {
                const cellValue = row.get(phoneColumn) || '';
                const regex = new RegExp(phone, 'i');
                return regex.test(cellValue);
            });

            if (!userRow) return null;

            const user = User.fromSheetRow(userRow);
            console.log('Usuario encontrado:', user.nickname, user.clientType);
            return user.toJSON();
        } catch (error) {
            console.error('Error al buscar usuario:', error);
            throw error;
        }
    }

    async checkStock(product, size) {
        try {
            console.log('Verificando stock para:', product, 'medida:', size);
            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle['Inventario'];
            const rows = await sheet.getRows();

            // Primera búsqueda: producto como marca
            let products = rows
                .filter(row => {
                    const isActive = row.get('Activo')?.toLowerCase() === 'si';
                    const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                    const nameMatch = row.get('Proveedor')?.toLowerCase().includes(product.toLowerCase());
                    const sizeMatch = size ?
                        row.get('Código')?.toLowerCase() === size.toLowerCase() :
                        true;

                    return isActive && showInSales && nameMatch && sizeMatch;
                })
                .map(row => Product.fromSheetRow(row))
                .filter(product => product.stock.total > 0);

            // Si no hay resultados, intentar con producto como medida
            if (products.length === 0 && size) {
                products = rows
                    .filter(row => {
                        const isActive = row.get('Activo')?.toLowerCase() === 'si';
                        const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                        const nameMatch = row.get('Proveedor')?.toLowerCase().includes(size.toLowerCase());
                        const sizeMatch = row.get('Código')?.toLowerCase() === product.toLowerCase();

                        return isActive && showInSales && nameMatch && sizeMatch;
                    })
                    .map(row => Product.fromSheetRow(row))
                    .filter(product => product.stock.total > 0);
            }

            // Si aún no hay resultados, buscar en el nombre del producto
            if (products.length === 0) {
                products = rows
                    .filter(row => {
                        const isActive = row.get('Activo')?.toLowerCase() === 'si';
                        const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                        const nameMatch = row.get('Nombre')?.toLowerCase().includes(product.toLowerCase());
                        const sizeMatch = size ?
                            row.get('Código')?.toLowerCase() === size.toLowerCase() :
                            true;

                        return isActive && showInSales && nameMatch && sizeMatch;
                    })
                    .map(row => Product.fromSheetRow(row))
                    .filter(product => product.stock.total > 0);
            }

            return products.map(product => product.toJSON());
        } catch (error) {
            console.error('Error al verificar stock:', error);
            throw error;
        }
    }

    async checkPrice(product, size, threadInfo) {
        try {
            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle['Inventario'];
            const rows = await sheet.getRows();
            const clientType = threadInfo?.userData?.clientType;

            // Primera búsqueda: producto como marca
            let products = rows
                .filter(row => {
                    const isActive = row.get('Activo')?.toLowerCase() === 'si';
                    const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                    const nameMatch = row.get('Proveedor')?.toLowerCase().includes(product.toLowerCase());
                    const sizeMatch = size ?
                        row.get('Código')?.toLowerCase() === size.toLowerCase() :
                        true;

                    return isActive && showInSales && nameMatch && sizeMatch;
                })
                .map(row => {
                    const product = Product.fromSheetRow(row);
                    product.price = getPriceByType(row, clientType);
                    return product;
                })
                .filter(product => product.stock.total > 0);

            // Si no hay resultados, intentar con producto como medida
            if (products.length === 0 && size) {
                products = rows
                    .filter(row => {
                        const isActive = row.get('Activo')?.toLowerCase() === 'si';
                        const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                        const nameMatch = row.get('Proveedor')?.toLowerCase().includes(size.toLowerCase());
                        const sizeMatch = row.get('Código')?.toLowerCase() === product.toLowerCase();

                        return isActive && showInSales && nameMatch && sizeMatch;
                    })
                    .map(row => {
                        const product = Product.fromSheetRow(row);
                        product.price = getPriceByType(row, clientType);
                        return product;
                    })
                    .filter(product => product.stock.total > 0);
            }

            // Si aún no hay resultados, buscar en el nombre del producto
            if (products.length === 0) {
                products = rows
                    .filter(row => {
                        const isActive = row.get('Activo')?.toLowerCase() === 'si';
                        const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                        const nameMatch = row.get('Nombre')?.toLowerCase().includes(product.toLowerCase());
                        const sizeMatch = size ?
                            row.get('Código')?.toLowerCase() === size.toLowerCase() :
                            true;

                        return isActive && showInSales && nameMatch && sizeMatch;
                    })
                    .map(row => {
                        const product = Product.fromSheetRow(row);
                        product.price = getPriceByType(row, clientType);
                        return product;
                    })
                    .filter(product => product.stock.total > 0);
            }

            return products.map(product => product.toJSON());
        } catch (error) {
            console.error('Error al verificar precio:', error);
            throw error;
        }
    }

    async makeReservation(phone, product, size, quantity, threadInfo) {
        try {
            await this.doc.loadInfo();
            const inventorySheet = this.doc.sheetsByTitle['Inventario'];
            const reservationsSheet = this.doc.sheetsByTitle['Reservas'];
            const userSheet = this.doc.sheetsByTitle['Clientes'];

            const matchingProducts = await this.checkPrice(product, size, threadInfo);

            if (!matchingProducts || matchingProducts.length === 0) {
                return {
                    success: false,
                    message: "Producto no encontrado"
                };
            }

            if (matchingProducts.length > 1) {
                return {
                    success: false,
                    message: "Múltiples productos encontrados",
                    products: matchingProducts.map(p => ({
                        name: p.name,
                        size: p.size,
                        brand: p.brand,
                        stock: p.stock.total,
                        price: p.price
                    })),
                    requiresSpecification: true
                };
            }

            const productInfo = matchingProducts[0];

            if (productInfo.stock.total < quantity) {
                return {
                    success: false,
                    message: "No hay suficiente stock disponible"
                };
            }

            const rows = await userSheet.getRows();
            const userRow = rows.find(row => {
                const userPhone = row.get('Celular') || '';
                return userPhone.includes(phone);
            });

            if (!userRow) {
                return {
                    success: false,
                    message: "Usuario no encontrado"
                };
            }

            const user = User.fromSheetRow(userRow);
            const reference = await generateUniqueReference();

            // Actualizar stock
            const inventoryRows = await inventorySheet.getRows();
            const item = inventoryRows.find(row =>
                row.get('Nombre').toLowerCase() === productInfo.name.toLowerCase() &&
                row.get('Código').toLowerCase() === productInfo.size.toLowerCase()
            );

            const newStock = parseInt(item.get('Stock Total')) - quantity;
            item.set('Stock Total', newStock);
            await item.save();

            // Crear reserva
            const reservation = new Reservation({
                date: new Date().toISOString(),
                reference: reference,
                client: `${user.firstName} ${user.lastName}`,
                phone: phone,
                email: user.email,
                cuit: user.cuit,
                price: productInfo.price * quantity,
                product: productInfo.name,
                size: productInfo.size,
                quantity: quantity,
                status: 'Pendiente'
            });

            await reservationsSheet.addRow(reservation.toSheetRow());

            return {
                success: true,
                reference: reference,
                reservationDetails: {
                    ...reservation.toJSON(),
                    message: `Reserva creada exitosamente. Tu código de referencia es: ${reference}`
                }
            };

        } catch (error) {
            console.error('Error al crear la reserva:', error);
            return {
                success: false,
                message: "Error al procesar la reserva",
                error: error.message
            };
        }
    }

    async cancelReservation(reference, from, threadInfo) {
        try {
            await this.doc.loadInfo();
            const reservationsSheet = this.doc.sheetsByTitle['Reservas'];
            const inventorySheet = this.doc.sheetsByTitle['Inventario'];

            const reservationRows = await reservationsSheet.getRows();
            const reservationRow = reservationRows.find(row =>
                row.get('Reference') === reference &&
                row.get('Telefono').includes(from)
            );

            if (!reservationRow) {
                return {
                    success: false,
                    message: "Reserva no encontrada o no pertenece a este usuario"
                };
            }

            const reservation = Reservation.fromSheetRow(reservationRow);

            if (reservation.status.toLowerCase() !== 'pendiente') {
                return {
                    success: false,
                    message: `La reserva no puede ser cancelada porque su estado es: ${reservation.status}`
                };
            }

            const inventoryRows = await inventorySheet.getRows();
            const product = inventoryRows.find(row =>
                row.get('Nombre').toLowerCase() === reservation.product.toLowerCase() &&
                row.get('Código') === reservation.size
            );

            if (product) {
                const currentStock = parseInt(product.get('Stock Total')) || 0;
                const returnQuantity = reservation.quantity;
                product.set('Stock Total', currentStock + returnQuantity);
                await product.save();
            }

            reservationRow.set('Status', 'Cancelada');
            await reservationRow.save();

            return {
                success: true,
                message: "Reserva cancelada exitosamente",
                details: {
                    reference: reference,
                    product: reservation.product,
                    size: reservation.size,
                    quantity: reservation.quantity,
                    status: 'Cancelada'
                }
            };

        } catch (error) {
            console.error('Error al cancelar la reserva:', error);
            return {
                success: false,
                message: "Error al cancelar la reserva",
                error: error.message
            };
        }
    }

    async searchProducts(query, size = null, threadInfo) {
        try {
            console.log('Query original:', query);
            const tireSizeRegex = /(\d{2,3})\s*(?:\/|\\|\s+)?(\d{2,3})\s+[rR]?(\d{2})/;
            const tireSizeMatch = query.match(tireSizeRegex);
            let isTireSearch = false;
    
            if (tireSizeMatch) {
                // Si la query parece ser una medida, la formateamos correctamente
                const formattedSize = `${tireSizeMatch[1]}/${tireSizeMatch[2]} R${tireSizeMatch[3]}`;
                console.log('Detectada medida de neumático:', formattedSize);
                isTireSearch = true;
                size = formattedSize;
            }
    
            console.log('Buscando productos con query:', query, 'medida:', size);
            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle['Inventario'];
            const rows = await sheet.getRows();
            const clientType = threadInfo?.userData?.clientType;
    
            const searchQuery = query.toLowerCase();
    
            let products = rows
                .filter(row => {
                    const isActive = row.get('Activo')?.toLowerCase() === 'si';
                    const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                    
                    // Si es búsqueda por medida de neumático, ignoramos la query y buscamos solo por medida
                    const sizeMatch = size ? 
                        row.get('Código')?.toLowerCase() === size.toLowerCase() : 
                        true;
    
                    let nameMatch = true;
                    if (!isTireSearch) {
                        // Si no es búsqueda por medida, aplicamos la búsqueda normal
                        nameMatch = row.get('Nombre')?.toLowerCase().includes(searchQuery) ||
                                  row.get('Proveedor')?.toLowerCase().includes(searchQuery);
                    }
    
                    return isActive && showInSales && sizeMatch && nameMatch;
                })
                .map(row => {
                    const product = Product.fromSheetRow(row);
                    product.price = getPriceByType(row, clientType);
                    return product;
                })
                .filter(product => product.stock.total > 0);
    
            // Si no encontramos nada, intentamos una búsqueda más flexible
            if (products.length === 0) {
                products = rows
                    .filter(row => {
                        const isActive = row.get('Activo')?.toLowerCase() === 'si';
                        const showInSales = row.get('Mostrar en Ventas')?.toLowerCase() === 'si';
                        
                        // Búsqueda más flexible para la medida
                        const sizeMatch = size ?
                            row.get('Código')?.toLowerCase().includes(size.toLowerCase()) :
                            true;
    
                        let nameMatch = true;
                        if (!isTireSearch) {
                            // Solo aplicamos búsqueda por nombre si no es búsqueda por medida
                            nameMatch = row.get('Nombre')?.toLowerCase().includes(searchQuery) ||
                                      row.get('Proveedor')?.toLowerCase().includes(searchQuery);
                        }
    
                        return isActive && showInSales && (sizeMatch || nameMatch);
                    })
                    .map(row => {
                        const product = Product.fromSheetRow(row);
                        product.price = getPriceByType(row, clientType);
                        return product;
                    })
                    .filter(product => product.stock.total > 0);
            }
    
            console.log(`Encontrados ${products.length} productos`);
            return products.map(product => product.toJSON());
        } catch (error) {
            console.error('Error al buscar productos:', error);
            throw error;
        }
    }
}

module.exports = new GoogleSheetsService();