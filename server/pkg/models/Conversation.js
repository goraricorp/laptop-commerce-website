// models/Account.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require("./Product");
const Account = require("./Account");
const User = require("./User");

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idaccount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Account,
            key: 'idaccount',
        },
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'conversation',
    timestamps: false,
});
Account.hasMany(Conversation, { foreignKey: 'idaccount' });
Conversation.belongsTo(Account, { foreignKey: 'idaccount' });
module.exports = Conversation;
