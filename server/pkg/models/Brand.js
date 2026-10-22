const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('Brand', {
    idbrand: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    brand_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    brand_logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'brand',
    timestamps: false,
});

// Product.hasMany(Brand, { foreignKey: 'idproduct' });
// Brand.belongsTo(Product, { foreignKey: 'idproduct' });

module.exports = Brand;
