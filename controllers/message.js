const express = require("express");
const router = express.Router();
const Message = require("../models/message");

// Get all messages for a session
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const messages = await Message.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 })
      .lean(); // Convert to plain JavaScript objects
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Save a new message
router.post("/messages", async (req, res) => {
  try {
    const { sessionId, sender, content } = req.body;
    const newMessage = new Message({
      sessionId,
      sender,
      content,
      timestamp: new Date(),
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
