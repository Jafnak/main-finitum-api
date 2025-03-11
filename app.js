const routes = require("./routes");
const mongoose = require("mongoose");

const express = require("express");
const http = require("http");
const setupSocketIO = require("./websocket/chat");

const cors = require("cors");

require("dotenv").config();

const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const server = http.createServer(app);

// Set up Socket.IO
setupSocketIO(server);

app.use(cors());
app.use(express.json());
app.use(routes);

server.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});
