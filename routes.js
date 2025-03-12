const express = require("express");
const router = express.Router();
const auth = require("./controllers/auth");
const session = require("./controllers/session");
const { router: tictactoeRouter } = require("./controllers/tictactoe");

router.use("/auth", auth);
router.use("/session", session);
router.use("/tictactoe", tictactoeRouter);

module.exports = router;
