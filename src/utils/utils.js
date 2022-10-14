const { db } = require("../db/db");

const isEmptyOrUndefined = (str) => {
  if (str === undefined || str === "") {
    return true;
  }
  return false;
};

const getAuthorizedUserData = async (authToken) => {
  const users = await db.getData("/users");

  const foundUser = users.find((user) => user.authToken === authToken);

  if (foundUser) {
    return foundUser;
  }

  return undefined;
};

module.exports = {
  isEmptyOrUndefined,
  getAuthorizedUserData,
};
