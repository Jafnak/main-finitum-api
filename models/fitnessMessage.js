const mongoose = require("mongoose");

const fitnessMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ["message", "challenge"], default: "message" },
});

const FitnessMessage = mongoose.model("FitnessMessage", fitnessMessageSchema);
module.exports = FitnessMessage;
