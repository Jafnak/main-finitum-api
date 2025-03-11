const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Session name (e.g., Study Group, Gaming Room)
  type: {
    type: String,
    enum: ["Study Group", "Gaming", "Health & Fitness"],
    required: true,
  },
  friendEmail: { type: String, required: true },
  createdBy: { type: String, required: true }, // Add this field
  // Creator of the session
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users in the session
  startTime: { type: Date, default: Date.now }, // When the session starts
  duration: { type: Number, required: true }, // In minutes (e.g., 60 min)
  endTime: { type: Date, required: false }, // Automatically calculate: startTime + duration
  isActive: { type: Boolean, default: true }, // Whether session is still active
});

// Auto-set endTime based on duration
sessionSchema.pre("save", function (next) {
  this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
  next();
});

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
