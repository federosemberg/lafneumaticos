// src/models/reservation.model.js
class Reservation {
    constructor(data) {
        this.date = data.date || new Date().toISOString();
        this.reference = data.reference;
        this.client = data.client;
        this.phone = data.phone;
        this.email = data.email;
        this.cuit = data.cuit;
        this.price = parseFloat(data.price) || 0;
        this.product = data.product;
        this.size = data.size;
        this.quantity = parseInt(data.quantity) || 0;
        this.status = data.status || 'Pendiente';
    }

    toJSON() {
        return {
            date: this.date,
            reference: this.reference,
            client: this.client,
            phone: this.phone,
            email: this.email,
            cuit: this.cuit,
            price: this.price,
            product: this.product,
            size: this.size,
            quantity: this.quantity,
            status: this.status
        };
    }

    static fromSheetRow(row) {
        return new Reservation({
            date: row.get('Fecha'),
            reference: row.get('Reference'),
            client: row.get('Cliente'),
            phone: row.get('Telefono'),
            email: row.get('Email'),
            cuit: row.get('CUIT'),
            price: row.get('Precio'),
            product: row.get('Producto'),
            size: row.get('Medidas'),
            quantity: row.get('Cantidad'),
            status: row.get('Status')
        });
    }

    toSheetRow() {
        return {
            'Fecha': this.date,
            'Reference': this.reference,
            'Cliente': this.client,
            'Telefono': this.phone,
            'Email': this.email,
            'CUIT': this.cuit,
            'Precio': this.price,
            'Producto': this.product,
            'Medidas': this.size,
            'Cantidad': this.quantity,
            'Status': this.status
        };
    }
}

module.exports = Reservation;