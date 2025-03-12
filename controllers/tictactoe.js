const express = require("express");
const router = express.Router();

// Store game states in memory
const games = new Map();

// Socket.IO event handlers
const initializeTicTacToe = (io) => {
  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("joinGame", ({ sessionId, playerName }) => {
      console.log("Join game request:", {
        sessionId,
        playerName,
        socketId: socket.id,
      });

      let game = games.get(sessionId);

      if (!game) {
        console.log("Creating new game:", sessionId);
        game = {
          board: Array(9).fill(""),
          players: [],
          spectators: [],
          currentPlayer: "X",
          status: "waiting",
        };
        games.set(sessionId, game);
      }

      // Check if player is already in the game
      const existingPlayer = game.players.find((p) => p.name === playerName);
      if (existingPlayer) {
        console.log("Player already in game:", playerName);
        existingPlayer.socketId = socket.id;
        socket.join(sessionId);

        // Re-emit game state to reconnected player
        socket.emit("gameStart", {
          symbol: existingPlayer.symbol,
          players: game.players,
        });

        if (game.players.length === 2) {
          socket.emit("gameReady", { players: game.players });
        }
        return;
      }

      // Join game as player if there's room
      if (game.players.length < 2) {
        const symbol = game.players.length === 0 ? "X" : "O";
        const player = { socketId: socket.id, name: playerName, symbol };
        game.players.push(player);
        socket.join(sessionId);

        console.log("Player joined:", { playerName, symbol });
        socket.emit("gameStart", {
          symbol,
          players: game.players,
        });

        // If game is now full, notify all players
        if (game.players.length === 2) {
          console.log("Game ready to start:", sessionId);
          io.to(sessionId).emit("gameReady", {
            players: game.players,
          });
          game.status = "playing";
        }
      } else {
        // Join as spectator
        console.log("Player joined as spectator:", playerName);
        game.spectators.push({ socketId: socket.id, name: playerName });
        socket.join(sessionId);
        socket.emit("gameSpectator", {
          players: game.players,
          board: game.board,
          status: game.status,
        });
      }

      // Notify all clients of updated player list
      io.to(sessionId).emit("playersUpdate", {
        players: game.players,
        spectators: game.spectators,
      });
    });

    socket.on("makeMove", ({ sessionId, index, symbol }) => {
      console.log(`Move received from ${socket.id}: ${index} ${symbol}`);
      const game = games.get(sessionId);

      if (!game || game.status !== "playing") {
        console.log("Game not found or not in playing state");
        return;
      }

      // Validate it's the player's turn
      const player = game.players.find((p) => p.socketId === socket.id);
      if (!player || player.symbol !== game.currentPlayer) {
        console.log("Not player's turn or invalid player");
        return;
      }

      // Validate move
      if (game.board[index] !== "") {
        console.log("Invalid move - cell already occupied");
        return;
      }

      // Make move
      game.board[index] = symbol;

      // Broadcast the move to all players
      io.to(sessionId).emit("gameMove", {
        index,
        symbol,
        currentPlayer: game.currentPlayer === "X" ? "O" : "X",
      });
      console.log(`Broadcasting move: ${index} ${symbol}`);

      // Check for winner
      const winner = checkWinner(game.board);
      if (winner) {
        game.status = "ended";
        game.winner = winner;
        const winningPlayer = game.players.find((p) => p.symbol === winner);
        io.to(sessionId).emit("gameWin", {
          winner,
          winnerName: winningPlayer.name,
        });
        console.log(`Game won by ${winningPlayer.name} (${winner})`);
      } else if (!game.board.includes("")) {
        game.status = "ended";
        io.to(sessionId).emit("gameDraw");
        console.log("Game ended in draw");
      } else {
        // Switch turns
        game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player ${socket.id} disconnected`);

      // Find any games this player was in
      for (const [sessionId, game] of games.entries()) {
        // Check if disconnected player was a player
        const playerIndex = game.players.findIndex(
          (p) => p.socketId === socket.id
        );
        if (playerIndex !== -1) {
          const player = game.players[playerIndex];
          game.players.splice(playerIndex, 1);
          if (game.players.length < 2) {
            game.status = "waiting";
            io.to(sessionId).emit("playerLeft", {
              playerName: player.name,
              remainingPlayers: game.players.map((p) => ({
                symbol: p.symbol,
                name: p.name,
              })),
            });
            console.log(`Player ${player.name} left game ${sessionId}`);
          }
        } else {
          // Check if disconnected player was a spectator
          const spectatorIndex = game.spectators.findIndex(
            (s) => s.socketId === socket.id
          );
          if (spectatorIndex !== -1) {
            game.spectators.splice(spectatorIndex, 1);
          }
        }

        // Broadcast updated player list
        io.to(sessionId).emit("playersUpdate", {
          players: game.players.map((p) => ({
            symbol: p.symbol,
            name: p.name,
          })),
          spectators: game.spectators.map((s) => s.name),
        });
      }
    });
  });
};

// Helper function to check for a winner
function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// REST endpoints (keeping these for compatibility)
router.post("/games", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const gameState = {
      board: Array(9).fill(""),
      players: [],
      currentPlayer: "X",
      status: "waiting",
      winner: null,
    };

    games.set(sessionId, gameState);
    res.status(201).json({ message: "Game created successfully", gameState });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/games/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const gameState = games.get(sessionId);

    if (!gameState) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(gameState);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { router, initializeTicTacToe };
