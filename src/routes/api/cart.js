const router = require("express").Router();
const { db } = require("../../db/db");
const { isEmptyOrUndefined, getAuthorizedUserData } = require("../../utils/utils");

router.get("/", async function (req, res) {
  const { authorization } = req.headers;

  if (isEmptyOrUndefined(authorization)) {
    return res.status(401).json({ error: true, msg: "Токен авторизации отсутствует" });
  }

  const userData = await getAuthorizedUserData(authorization);

  if (userData === undefined) {
    return res.status(401).json({ error: true, msg: "Неверный токен" });
  }

  const carts = await db.getData("/carts");
  const userCart = carts[userData.name];

  if (userCart) {
    const cartArray = [];
    const keys = Object.keys(userCart);

    for (const key of keys) {
      cartArray.push({
        id: key,
        name: userCart[key].name,
        price: userCart[key].price,
        quantity: userCart[key].quantity,
        totalPrice: userCart[key].totalPrice,
      });
    }

    return res.status(200).json(cartArray);
  } else {
    return res.status(200).json([]);
  }
});

router.put("/", async function (req, res) {
  const { authorization } = req.headers;
  const { quantity = 1, productId } = req.body;

  if (productId === undefined) {
    return res.status(400).json({ error: true, msg: "Вы не указали id продукта" });
  }

  if (isEmptyOrUndefined(authorization)) {
    return res.status(401).json({ error: true, msg: "Токен авторизации отсутствует" });
  }

  const userData = await getAuthorizedUserData(authorization);

  if (userData === undefined) {
    return res.status(401).json({ error: true, msg: "Неверный токен" });
  }

  const carts = await db.getData("/carts");

  const products = await db.getData("/products");

  if (Object.keys(products).includes(productId.toString())) {
    const userCart = carts[userData.name] ?? {};

    const productInCart = userCart[productId];
    const productInfo = await db.getData(`/products/${productId}`);

    if (productInCart) {
      if (productInfo.inStock - quantity < 0) {
        return res.status(400).json({ error: true, msg: "Товара нет в наличии" });
      }

      productInfo.inStock -= quantity;

      await db.push(`/products/${productId}`, productInfo);

      if (productInCart.quantity + quantity < 1) {
        delete userCart[productId];
        await db.push(`/carts/${userData.name}`, userCart);
        return res.status(200).json(productInfo);
      }

      const cart = {
        ...userCart,
        [productId]: {
          name: productInfo.name,
          price: productInfo.price,
          quantity: productInCart.quantity + quantity,
          totalPrice: productInCart.price * (productInCart.quantity + quantity),
        },
      };

      await db.push(`/carts/${userData.name}`, cart);

      return res.status(200).json(productInfo);
    } else {
      if (quantity < 0) {
        return res.status(200).json(productInfo);
      }

      if (productInfo.inStock - quantity < 0) {
        return res.status(400).json({ error: true, msg: "Товара нет в наличии" });
      }

      productInfo.inStock -= quantity;

      await db.push(`/products/${productId}`, productInfo);

      const cart = {
        ...userCart,
        [productId]: {
          name: productInfo.name,
          price: productInfo.price,
          quantity: quantity,
          totalPrice: productInfo.price * quantity,
        },
      };

      await db.push(`/carts/${userData.name}`, cart);

      return res.status(200).json(productInfo);
    }
  } else {
    return res.status(500).json({ error: true, msg: "Такого продукта не существует" });
  }
});

router.delete("/", async function (req, res) {
  const { authorization } = req.headers;
  const { productId } = req.body;

  if (isEmptyOrUndefined(authorization)) {
    return res.status(401).json({ error: true, msg: "Токен авторизации отсутствует" });
  }

  const userData = await getAuthorizedUserData(authorization);

  if (userData === undefined) {
    return res.status(401).json({ error: true, msg: "Неверный токен" });
  }

  const carts = await db.getData("/carts");

  const products = await db.getData("/products");

  const userCart = carts[userData.name];

  if (userCart === undefined) {
    return res.status(400).json({ error: true, msg: "Корзина пользователя пуста" });
  }

  if (productId !== undefined) {
    if (Object.keys(products).includes(productId.toString())) {
      const productInCart = userCart[productId];
      const productInfo = await db.getData(`/products/${productId}`);

      if (productInCart) {
        productInfo.inStock += productInCart.quantity;

        await db.push(`/products/${productId}`, productInfo);

        delete userCart[productId];

        await db.push(`/carts/${userData.name}`, userCart);

        return res.status(200).json(userCart);
      } else {
        return res.status(500).json({ error: true, msg: "Такого продукта нет в корзине" });
      }
    } else {
      return res.status(500).json({ error: true, msg: "Такого продукта не существует" });
    }
  } else {
    const keys = Object.keys(userCart);

    for (const key of keys) {
      products[key].inStock += userCart[key].quantity;
    }

    delete carts[userData.name];

    await db.push("/products", products);
    await db.push("/carts", carts);

    return res.status(200).json([]);
  }
});

module.exports = router;
