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
  endTime: { type: Date },
  isActive: { type: Boolean, default: true }, // Whether session is still active
});

// Calculate endTime before saving
sessionSchema.pre("save", function (next) {
  if (
    this.isNew ||
    this.isModified("startTime") ||
    this.isModified("duration")
  ) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
  }
  next();
});

// Virtual property to check if session is active
sessionSchema.virtual("status").get(function () {
  const now = new Date();
  if (now > this.endTime) {
    return "inactive";
  }
  return "active";
});

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
