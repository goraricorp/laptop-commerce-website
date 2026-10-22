const { Sequelize } = require("sequelize");
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.SQL_USERNAME,
    process.env.SQL_PASSWORD,
    {
        host: 'localhost',
        dialect: 'mysql',
        dialectModule: require('mysql2'),
        logging: false,
    }
);

// sequelize.sync({ force: true }).then(() => {
//     console.log("Database & tables created!");
// }).catch(error => {
//     console.log("Error syncing models:", error);
// });

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.error('Unable to connect to the database: ', error);
});

module.exports = sequelize;