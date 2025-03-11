const express = require("express");
const router = express.Router();
// Import your Session model
const Session = require("../models/session");

// Create a new session
router.post("/sessions", async (req, res) => {
  try {
    const { name, type, duration, friendEmail, createdBy } = req.body;

    // Check if all fields are provided
    if (!name || !type || !duration || !friendEmail || !createdBy) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new session with creator info
    const newSession = new Session({
      name,
      type,
      duration,
      friendEmail,
      createdBy,
    });
    await newSession.save();

    res.status(201).json({
      message: "Session created successfully",
      sessionId: newSession._id,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single session
router.get("/sessions/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all sessions
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
