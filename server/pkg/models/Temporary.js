const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Temporary = sequelize.define('Temporary', {
    idtemporary: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    token_verify: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'temporary',
    timestamps: false,
});

module.exports = Temporary;
