const express = require("express");
const router = express.Router();
const FitnessMessage = require("../models/fitnessMessage");
const FitnessChallenge = require("../models/fitnessChallenge");

// Get messages for a session
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const messages = await FitnessMessage.find({
      sessionId: req.params.sessionId,
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching fitness messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Save a new message
router.post("/messages", async (req, res) => {
  try {
    const { sessionId, user, text, type = "message" } = req.body;
    const newMessage = new FitnessMessage({
      sessionId,
      user,
      text,
      type,
      timestamp: new Date(),
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving fitness message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Get all challenges for a session
router.get("/challenges/:sessionId", async (req, res) => {
  try {
    const challenges = await FitnessChallenge.find({
      sessionId: req.params.sessionId,
    }).sort({ timestamp: -1 });
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// Create a new challenge
router.post("/challenges", async (req, res) => {
  try {
    const { sessionId, title, description, duration, difficulty, createdBy } =
      req.body;
    const newChallenge = new FitnessChallenge({
      sessionId,
      title,
      description,
      duration,
      difficulty,
      createdBy,
      notes: [],
    });
    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

// Add a note to a challenge
router.post("/challenges/:challengeId/notes", async (req, res) => {
  try {
    const { text, user } = req.body;
    const challenge = await FitnessChallenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    challenge.notes.push({
      text,
      user,
      timestamp: new Date(),
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
});

module.exports = router;
