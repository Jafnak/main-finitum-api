const express = require("express");
const router = express.Router();
const auth = require("./controllers/auth");
const session = require("./controllers/session");
router.use("/auth", auth);
router.use("/session", session);

module.exports = router;
