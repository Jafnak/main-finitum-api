const express = require("express");
const router = express.Router();

const authRoutes = require("../controllers/auth");
const sessionRoutes = require("../controllers/session");
const messageRoutes = require("../controllers/message");

router.use("/auth", authRoutes);
router.use("/session", sessionRoutes);
router.use("/message", messageRoutes);

module.exports = router;
