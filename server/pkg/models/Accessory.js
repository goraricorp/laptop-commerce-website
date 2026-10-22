// models/Accessory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const Accessory = sequelize.define('Accessory', {
    idaccessory: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idproduct: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'idproduct',
        },
    },
    nums_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    switch_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    connection: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'accessory',
    timestamps: false,
});

Product.hasMany(Accessory, { foreignKey: 'idproduct' });
Accessory.belongsTo(Product, { foreignKey: 'idproduct' });

module.exports = Accessory;
