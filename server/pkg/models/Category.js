// models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    idcategory: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'category',
    timestamps: false,
});

module.exports = Category;
