const router = require("express").Router();
const { db } = require("../../db/db");
const { isEmptyOrUndefined, getAuthorizedUserData } = require("../../utils/utils");

router.get("/", async function (req, res) {
  const { authorization } = req.headers;

  const userData = await getAuthorizedUserData(authorization);

  if (userData === undefined) {
    return res.status(401).json({ error: true, msg: "Неверный токен" });
  }

  return res.status(200).json({ error: false, name: userData.name, userRole: userData.role });
});

router.post("/", async function (req, res) {
  const { login, password } = req.body;

  if (isEmptyOrUndefined(login) || isEmptyOrUndefined(password)) {
    return res.status(401).json({ error: true, msg: "Введите логин или пароль" });
  }

  const users = await db.getData("/users");
  const foundUser = users.find((user) => user.name === login);

  if (foundUser === undefined || foundUser.password !== password) {
    return res.status(401).json({ error: true, msg: "Неверный логин или пароль" });
  }

  return res.status(200).json({ error: false, authToken: foundUser.authToken, userRole: foundUser.role, name: foundUser.name });
});

module.exports = router;
