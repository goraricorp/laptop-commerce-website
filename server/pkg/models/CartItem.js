// models/CartItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cart = require('./Cart');
const Product = require('./Product');
const Color = require('./Color');
const Configuration = require('./Configuration');
const Accessory = require('./Accessory');

const CartItem = sequelize.define('CartItem', {
    idcart_item: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idcart: {
        type: DataTypes.INTEGER,
        references: {
            model: Cart,
            key: 'idcart',
        },
        allowNull: false,
    },
    idproduct: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'idproduct',
        },
        allowNull: true,
    },
    idcolor: {
        type: DataTypes.INTEGER,
        references: {
            model: Color,
            key: 'idcolor',
        },
        allowNull: true,
    },
    idconfiguration: {
        type: DataTypes.INTEGER,
        references: {
            model: Configuration,
            key: 'idconfiguration',
        },
        allowNull: true,
    },
    idaccessory: {
        type: DataTypes.INTEGER,
        references: {
            model: Accessory,
            key: 'idaccessory',
        },
        allowNull: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'cart_item',
    timestamps: false,
});

Cart.hasMany(CartItem, { foreignKey: 'idcart' });
CartItem.belongsTo(Cart, { foreignKey: 'idcart' });
Product.hasMany(CartItem, { foreignKey: 'idproduct' });
CartItem.belongsTo(Product, { foreignKey: 'idproduct' });
Color.hasMany(CartItem, { foreignKey: 'idcolor' });
CartItem.belongsTo(Color, { foreignKey: 'idcolor' });
Configuration.hasMany(CartItem, { foreignKey: 'idconfiguration' });
CartItem.belongsTo(Configuration, { foreignKey: 'idconfiguration' });
Accessory.hasMany(CartItem, { foreignKey: 'idaccessory' });
CartItem.belongsTo(Accessory, { foreignKey: 'idaccessory' });

module.exports = CartItem;
