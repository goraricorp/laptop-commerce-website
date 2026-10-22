// models/Discount.js
const { DataTypes, TINYINT } = require('sequelize');
const sequelize = require('../config/database');

const Discount = sequelize.define('Discount', {
    iddiscount: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    discount_name: {
        type: DataTypes.STRING(8),
        allowNull: false,
    },
    percentage_discount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    value_discount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: TINYINT,
        allowNull: false,
        defaultValue: 0,
    },

}, {
    tableName: 'discount',
    timestamps: false,
});

module.exports = Discount;
