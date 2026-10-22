// models/Bill.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');
const Address = require('./Address');
const Discount = require('./Discount');

const Bill = sequelize.define('Bill', {
    idbill: {
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
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    iddiscount: {
        type: DataTypes.INTEGER,
        references: {
            model: Discount,
            key: 'iddiscount',
        },
    },
    idaddress: {
        type: DataTypes.INTEGER,
        references: {
            model: Address,
            key: 'idaddress',
        },
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    tableName: 'bill',
    timestamps: false,
});

Account.hasMany(Bill, { foreignKey: 'idaccount' });
Bill.belongsTo(Account, { foreignKey: 'idaccount' });
Discount.hasMany(Bill, { foreignKey: 'iddiscount' });
Bill.belongsTo(Discount, { foreignKey: 'iddiscount' });
Address.hasMany(Bill, { foreignKey: 'idaddress' });
Bill.belongsTo(Address, { foreignKey: 'idaddress' });

module.exports = Bill;
