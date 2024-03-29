import express from "express";
import bodyParser from "body-parser";
import { USERS, ORDERS } from "./db.js";
import { authorizationMiddleware } from "./middlewares.js";

const app = express();

app.use(bodyParser.json());

/**
 * POST -- create resource
 * req -> input data
 * res -> output data
 */
app.post("/users", (req, res) => {
  const { body } = req;

  console.log(`body`, JSON.stringify(body));

  const isUserExist = USERS.some((el) => el.login === body.login);
  if (isUserExist) {
    return res
      .status(400)
      .send({ message: `user with login ${body.login} already exists` });
  }

  USERS.push(body);

  res.status(200).send({ message: "User was created" });
});

app.get("/users", (req, res) => {
  const users = USERS.map((user) => {
    const { password, ...other } = user;
    return other;
  });
  return res.status(200).send(users);
});

app.post("/login", (req, res) => {
  const { body } = req;

  const user = USERS.find(
    (el) => el.login === body.login && el.password === body.password
  );

  if (!user) {
    return res.status(400).send({ message: "User was not found" });
  }

  const token = crypto.randomUUID();

  user.token = token;
  USERS.save(user.login, { token });

  return res.status(200).send({
    token,
    message: "User was login",
  });
});

app.post("/orders", authorizationMiddleware, (req, res) => {
  const { body, user } = req;

  const order = {
    ...body,
    login: user.login,
    price: Math.floor(Math.random() * (100 - 20 + 1)) + 20,
  };

  ORDERS.push(order);

  return res.status(200).send({ message: "Order was created", order });
});

app.get("/orders", authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter((el) => el.login === user.login);
  return res.status(200).send(orders);
});

app.get("/address/from/last-5", authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter((el) => el.login === user.login);
  let last_five = new Set(orders.slice(-5));
  return res.status(200).send(last_five.map((e) => e["from"]));
});

app.get("/address/to/last-3", authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter((el) => el.login === user.login);
  const uniqueAddresses = new Set(orders.map((obj) => obj.to));
  const result = [...uniqueAddresses].slice(0, 3);
  return res.status(200).send(result);
});

app.get("/orders/highest", authorizationMiddleware, (req, res) => {
  const orders = ORDERS.filter((el) => el.price);

  let highest = 0;
  let highest_order = null;
  for (const e of orders) {
    if (e["price"] > highest) {
      highest = e["price"];
      highest_order = e;
    }
  }

  return res.status(200).send(highest_order);
});
app.get("/orders/lowest", authorizationMiddleware, (req, res) => {
  const orders = ORDERS.filter((el) => el.price);

  let lowest = Infinity;
  let lowest_order = null;
  for (const e of orders) {
    if (e["price"] < lowest) {
      lowest = e["price"];
      lowest_order = e;
    }
  }
  return res.status(200).send(lowest_order);
});
app.listen(8080, () => console.log("Server was started"));
