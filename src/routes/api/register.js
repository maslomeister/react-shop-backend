const router = require("express").Router();
const { db } = require("../../db/db");
const randomstring = require("randomstring");
const { isEmptyOrUndefined } = require("../../utils/utils");

router.post("/", async function (req, res) {
  const { login, password } = req.body;

  if (isEmptyOrUndefined(login) || isEmptyOrUndefined(password)) {
    return res.status(401).json({ error: true, msg: "Введите логин или пароль" });
  }

  const users = await db.getData("/users");
  const foundUser = users.find((user) => user.name === login);

  if (foundUser) {
    return res.status(401).json({ error: true, msg: "Такой логин уже существует" });
  }

  const newUser = {
    id: users.length,
    name: login,
    role: "user",
    password: password,
    authToken: randomstring.generate(25),
  };

  try {
    users.push(newUser);
    const success = await db.push("/users", users);
    return res.status(200).json({ authToken: newUser.authToken, userRole: newUser.role, name: newUser.name });
  } catch (error) {
    return res.status(500).json({ error: true, msg: error });
  }
});

module.exports = router;
