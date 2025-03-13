const mongoose = require("mongoose");

const fitnessChallengeSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  difficulty: { type: String, required: true },
  createdBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  notes: [
    {
      text: { type: String, required: true },
      user: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const FitnessChallenge = mongoose.model(
  "FitnessChallenge",
  fitnessChallengeSchema
);
module.exports = FitnessChallenge;
