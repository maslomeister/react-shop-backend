const { JsonDB, Config } = require("node-json-db");

const db = new JsonDB(new Config("database", true, false, "/"));

module.exports = {
  db,
};
