// models/Cart.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');

const Cart = sequelize.define('Cart', {
    idcart: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idaccount: {
        type: DataTypes.INTEGER,
        references: {
            model: Account,
            key: 'idaccount',
        },
    },
}, {
    tableName: 'cart',
    timestamps: false,
});

Account.hasOne(Cart, { foreignKey: 'idaccount' });
Cart.belongsTo(Account, { foreignKey: 'idaccount' });

module.exports = Cart;
