// models/Address.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');

const Address = sequelize.define('Address', {
    idaddress: {
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
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tower: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    district: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'address',
    timestamps: false,
});

Account.hasMany(Address, { foreignKey: 'idaccount' });
Address.belongsTo(Account, { foreignKey: 'idaccount' });

module.exports = Address;
