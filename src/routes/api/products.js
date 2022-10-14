const router = require("express").Router();
const { db } = require("../../db/db");
const { isEmptyOrUndefined } = require("../../utils/utils");

router.get("/:id", async function (req, res) {
  const { id } = req.params;
  const product = await db.getData(`/products/${id}`);

  return res.status(200).json({
    id: id,
    name: product.name,
    description: product.description,
    price: product.price,
    inStock: product.inStock,
    picture: product.picture,
  });
});

router.put("/:id", async function (req, res) {
  const { id } = req.params;
  const { name, description, price, inStock } = req.body;
  const products = await db.getData(`/products`);

  const oldName = products[id].name;
  const oldPrice = products[id].price;

  if (isEmptyOrUndefined(name) || isEmptyOrUndefined(description) || isEmptyOrUndefined(price) || isEmptyOrUndefined(inStock)) {
    return res.status(400).json({ error: true, msg: "Одно или несколько полей пустые" });
  }

  if (name.length > 30) {
    return res.status(400).json({ error: true, msg: "Имя не может содержать больше 30 символов" });
  }

  if (description.length > 600) {
    return res.status(400).json({ error: true, msg: "Описание не может содержать больше 600 символов" });
  }

  if (!Number.isInteger(inStock)) {
    return res.status(400).json({ error: true, msg: "Поле inStock не является числом" });
  }

  if (inStock < 0) {
    return res.status(400).json({ error: true, msg: "inStock не может быть отрицательным" });
  }

  if (typeof price !== "number") {
    return res.status(400).json({ error: true, msg: "Поле price не является числом" });
  }

  products[id] = {
    ...products[id],
    name,
    description,
    price,
    inStock,
  };

  if (name !== oldName || price !== oldPrice) {
    const carts = await db.getData("/carts");
    Object.keys(carts).forEach((key) => {
      Object.keys(carts[key]).forEach((value) => {
        if (value === id) {
          carts[key][value].name = name;
          carts[key][value].price = price;
          carts[key][value].totalPrice = price * carts[key][value].quantity;
        }
      });
    });

    await db.push("/carts", carts);
  }

  await db.push("/products", products);

  return res.status(200).json(products[id]);
});

router.get("/", async function (req, res) {
  const products = await db.getData("/products");
  const productsArray = [];
  const keys = Object.keys(products);

  for (const key of keys) {
    productsArray.push({
      id: key,
      name: products[key].name,
      description: products[key].description,
      price: products[key].price,
      inStock: products[key].inStock,
      picture: products[key].picture,
    });
  }
  return res.status(200).json(productsArray);
});

module.exports = router;
