const routes = require("./routes");
const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const setupChat = require("./websocket/chat");
const { initializeTicTacToe } = require("./controllers/tictactoe");

const cors = require("cors");

require("dotenv").config();

const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const server = createServer(app);

// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

setupChat(io);
initializeTicTacToe(io);

app.use(cors());
app.use(express.json());
app.use("/", routes);

server.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});
