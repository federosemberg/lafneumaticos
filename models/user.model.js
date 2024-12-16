// src/models/user.model.js
class User {
    constructor(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.nickname = data.nickname;
        this.phone = data.phone;
        this.email = data.email;
        this.cuit = data.cuit;
        this.clientType = data.clientType;
        this.isActive = data.isActive || true;
    }

    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            nickname: this.nickname,
            phone: this.phone,
            email: this.email,
            cuit: this.cuit,
            clientType: this.clientType,
            isActive: this.isActive
        };
    }

    static fromSheetRow(row) {
        return new User({
            id: row.get('Id'),
            firstName: row.get('Nombre'),
            lastName: row.get('Apellido'),
            nickname: row.get('Apodo'),
            phone: row.get('Celular'),
            email: row.get('Mail'),
            cuit: row.get('CUIT'),
            clientType: row.get('Tipo Cliente'),
            isActive: row.get('Activo')?.toLowerCase() === 'si'
        });
    }
}

module.exports = User;