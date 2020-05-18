const Sequelize = require("sequelize");
const sequelize = new Sequelize("mysql://root@localhost:3306/test", {
  timezone: "+05:30",
  dialect: "mysql", logging: false, pool: {
    max: 9,
    min: 0,
    idle: 10000,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/User")(sequelize, Sequelize);

module.exports = db;
