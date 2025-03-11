const mongoose = require("mongoose");
const schema = mongoose.Schema({
  name: { type: String, required: true },
  emailid: { type: String, required: true },
  age: { type: String, required: true },
  password: { type: String, required: true },
  confirmpass: { type: String, required: true },
  place: { type: String, required: true },
  interests: {
    type: String,
    enum: ["Study Group", "Gaming", "Health & Fitness"],
  },
  profileImage: { type: String },
});
let userModel = mongoose.model("users", schema);
module.exports = { userModel };
