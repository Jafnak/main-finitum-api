const Message = require("../models/message");
const FitnessMessage = require("../models/fitnessMessage");

const setupChat = (io) => {
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

    // Join fitness session
    socket.on("joinFitnessSession", async (data) => {
      const { sessionId, user } = data;
      socket.join(sessionId);
      console.log(`User ${user} joined fitness session ${sessionId}`);

      // Add user to online users
      onlineUsers.set(user, socket.id);
      userSessions.set(user, sessionId);

      // Broadcast updated online users list
      const sessionUsers = Array.from(userSessions.entries())
        .filter(([_, sid]) => sid === sessionId)
        .map(([user]) => user);
      io.to(sessionId).emit("online_users", sessionUsers);
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

    // Handle fitness messages
    socket.on("fitnessMessage", async (messageData) => {
      const { sessionId } = messageData;
      // Broadcast the message to all users in the room
      io.to(sessionId).emit("fitnessMessage", messageData);
    });

    // Handle fitness challenges
    socket.on("startChallenge", (data) => {
      const { sessionId, challenge } = data;
      io.to(sessionId).emit("challengeStarted", challenge);
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
          const sessionId = userSessions.get(email);
          onlineUsers.delete(email);
          userSessions.delete(email);

          // Broadcast updated online users list for the specific session
          if (sessionId) {
            const sessionUsers = Array.from(userSessions.entries())
              .filter(([_, sid]) => sid === sessionId)
              .map(([user]) => user);
            io.to(sessionId).emit("online_users", sessionUsers);
          }
          break;
        }
      }
    });
  });

  return io;
};

module.exports = setupChat;
