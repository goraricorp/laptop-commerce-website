// models/Rating.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');
const Product = require('./Product');

const Rating = sequelize.define('Rating', {
    idrating: {
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
    idproduct: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'idproduct',
        },
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    comment: {
        type: DataTypes.STRING(1023),
        allowNull: true,
    },
    rating_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'rating',
    timestamps: false,
});

Account.hasMany(Rating, { foreignKey: 'idaccount' });
Rating.belongsTo(Account, { foreignKey: 'idaccount' });

Product.hasMany(Rating, { foreignKey: 'idproduct' });
Rating.belongsTo(Product, { foreignKey: 'idproduct' });

module.exports = Rating;
