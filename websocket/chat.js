const { Server } = require("socket.io");
const Message = require("../models/message");

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Your React app URL
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map(); // Store online users and their socket IDs
  const userSessions = new Map(); // Store which session each user is in

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

    socket.on("user_online", (data) => {
      const { email, sessionId } = data;
      onlineUsers.set(email, socket.id);
      userSessions.set(email, sessionId);

      // Broadcast updated online users list to all connected clients
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("invite_user", (data) => {
      const { sessionId, invitedUser, invitedBy } = data;
      const invitedSocketId = onlineUsers.get(invitedUser);

      if (invitedSocketId) {
        io.to(invitedSocketId).emit("invitation_received", {
          sessionId,
          invitedBy,
          sessionName: sessions.get(sessionId)?.name || "Study Session",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Remove user from online users when they disconnect
      for (const [email, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(email);
          userSessions.delete(email);
          break;
        }
      }
      // Broadcast updated online users list
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = setupSocketIO;
