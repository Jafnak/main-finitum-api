const express = require("express");
const router = express.Router();
const { userModel } = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });

// Function to Hash Password
const generateHashedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// User Login
router.post("/login", (req, res) => {
  let input = req.body;
  userModel
    .find({ emailid: req.body.emailid })
    .then((response) => {
      if (response.length > 0) {
        let dbPassword = response[0].password;
        bcrypt.compare(input.password, dbPassword, (error, isMatch) => {
          if (isMatch) {
            jwt.sign(
              { emailid: input.emailid },
              process.env.JWT_SECRET,
              { expiresIn: "1d" },
              (error, token) => {
                if (error) {
                  res.json({ status: "unable to create token" });
                } else {
                  res.json({
                    status: "success",
                    userId: response[0]._id,
                    token: token,
                  });
                }
              }
            );
          } else {
            res.json({ status: "incorrect" });
          }
        });
      } else {
        res.json({ status: "user not found" });
      }
    })
    .catch((err) => res.status(500).json({ error: "Internal server error" }));
});

// User Signup
router.post("/signup", async (req, res) => {
  try {
    let input = req.body;
    input.password = await generateHashedPassword(input.password);
    let user = new userModel(input);
    await user.save();
    res.json({ status: "success" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Get User Profile
router.get("/user/:email", async (req, res) => {
  try {
    const user = await userModel.findOne({ emailid: req.params.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      name: user.name,
      emailid: user.emailid,
      place: user.place,
      interests: user.interests,
      profileImage: user.profileImage || null, // Include profile image
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload Profile Image
router.post(
  "/upload-profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const email = req.body.email;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      if (!email || !imageUrl) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const user = await userModel.findOneAndUpdate(
        { emailid: email },
        { profileImage: imageUrl },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "Profile image updated", imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

module.exports = router;
