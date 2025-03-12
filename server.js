const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const routes = require("./routes");
const { initializeTicTacToe } = require("./controllers/tictactoe");
const upload = require("./controllers/upload");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/", routes);
app.use("/upload", upload);

// Initialize Socket.IO events for TicTacToe
initializeTicTacToe(io);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
