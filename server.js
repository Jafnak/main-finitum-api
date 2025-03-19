const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const routes = require("./routes");
const { initializeTicTacToe } = require("./controllers/tictactoe");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Initialize Socket.IO handlers
initializeTicTacToe(io);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
