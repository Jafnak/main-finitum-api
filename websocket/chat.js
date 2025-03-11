const { Server } = require("socket.io");
const Message = require("../models/message");

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Your React app URL
      methods: ["GET", "POST"],
    },
  });

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a specific chat room
    socket.on("join_room", async (sessionId) => {
      socket.join(sessionId);
      console.log(`User ${socket.id} joined room ${sessionId}`);

      // Send existing messages to the user
      try {
        const messages = await Message.find({ sessionId })
          .sort({ timestamp: 1 })
          .lean();
        socket.emit("message_history", messages);
      } catch (error) {
        console.error("Error fetching message history:", error);
      }
    });

    // Handle new messages
    socket.on("send_message", async (messageData) => {
      try {
        const newMessage = new Message({
          sessionId: messageData.sessionId,
          sender: messageData.sender,
          content: messageData.content,
          timestamp: new Date(),
        });
        await newMessage.save();

        // Broadcast the message to all users in the room
        io.to(messageData.sessionId).emit("receive_message", newMessage);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = setupSocketIO;
