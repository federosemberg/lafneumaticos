// src/models/product.model.js
class Product {
    constructor(data) {
        this.id = data.id;
        this.name = data.product;
        this.brand = data.brand;
        this.type = data.type;
        this.size = data.size;
        this.stock = {
            total: parseInt(data.stock) || 0,
            warehouse: data.warehouse || 'No especificado',
            store: data.store || 'No especificado'
        };
        this.price = parseFloat(data.price) || 0;
        this.description = data.description;
        this.imageUrl = data.imageUrl;
        this.isActive = data.isActive || true;
        this.showInSales = data.showInSales || true;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            brand: this.brand,
            type: this.type,
            size: this.size,
            stock: this.stock,
            price: this.price,
            description: this.description,
            imageUrl: this.imageUrl,
            isActive: this.isActive,
            showInSales: this.showInSales
        };
    }

    static fromSheetRow(row) {
        return new Product({
            id: row.get('Id'),
            product: row.get('Nombre'),
            brand: row.get('Proveedor'),
            type: row.get('Tipo de Producto'),
            size: row.get('Código'),
            stock: row.get('Stock Total'),
            warehouse: row.get('Galpon'),
            store: row.get('Negocio'),
            price: row.get('Precio de Venta'),
            description: row.get('Descripción'),
            imageUrl: row.get('Imagen'),
            isActive: row.get('Activo')?.toLowerCase() === 'si',
            showInSales: row.get('Mostrar en Ventas')?.toLowerCase() === 'si'
        });
    }
}

module.exports = Product;