const routes = require("./routes");
const mongoose = require("mongoose");

const express = require("express");

const cors = require("cors");

require("dotenv").config();

const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGODB_URI);

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});
