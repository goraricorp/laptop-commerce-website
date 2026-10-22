// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');

const User = sequelize.define('User', {
    iduser: {
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
        allowNull: false,
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '../assets/img/avatars/0.png'
    },
    birthday: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'user',
    timestamps: false,
});

Account.hasOne(User, { foreignKey: 'idaccount' });
User.belongsTo(Account, { foreignKey: 'idaccount' });

module.exports = User;
