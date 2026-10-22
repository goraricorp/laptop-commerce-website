// models/Description.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const Description = sequelize.define('Description', {
    iddescription: {
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
        allowNull: false,
    },
    title_description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sub_description: {
        type: DataTypes.STRING(2047),
        allowNull: true,
    },
    img_description: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
}, {
    tableName: 'description',
    timestamps: false,
});

Product.hasMany(Description, { foreignKey: 'idproduct' });
Description.belongsTo(Product, { foreignKey: 'idproduct' });

module.exports = Description;
