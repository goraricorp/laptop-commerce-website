// models/BillDetail.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Bill = require('./Bill');
const Product = require('./Product');
const Color = require('./Color');
const Configuration = require('./Configuration');
const Accessory = require('./Accessory');

const BillDetail = sequelize.define('BillDetail', {
    idbill_details: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idbill: {
        type: DataTypes.INTEGER,
        references: {
            model: Bill,
            key: 'idbill',
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
    product_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'bill_detail',
    timestamps: false,
});

Bill.hasMany(BillDetail, { foreignKey: 'idbill' });
BillDetail.belongsTo(Bill, { foreignKey: 'idbill' });
Product.hasMany(BillDetail, { foreignKey: 'idproduct' });
BillDetail.belongsTo(Product, { foreignKey: 'idproduct' });
Color.hasMany(BillDetail, { foreignKey: 'idcolor' });
BillDetail.belongsTo(Color, { foreignKey: 'idcolor' });
Configuration.hasMany(BillDetail, { foreignKey: 'idconfiguration' });
BillDetail.belongsTo(Configuration, { foreignKey: 'idconfiguration' });
Accessory.hasMany(BillDetail, { foreignKey: 'idaccessory' });
BillDetail.belongsTo(Accessory, { foreignKey: 'idaccessory' });

module.exports = BillDetail;
