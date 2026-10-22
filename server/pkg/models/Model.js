const { Sequelize, DataTypes } = require("sequelize")

const sequelize = new Sequelize('test', 'root', 'Japtor@1999', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.error('Unable to connect to the database: ', error);
});

const Account = sequelize.define("account", {
    idaccount: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
});

sequelize.sync().then(() => {
    console.log('Account table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});