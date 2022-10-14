const express = require("express");
const cors = require("cors");

const server = express();
server.use(express.json());
server.use(cors());
server.options("*", cors());
const port = 5069;

server.use(require("./routes"));

server.listen(port, () => console.log(`Server is up at http://localhost:${port}`));
