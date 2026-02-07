"use strict";

import mongoose from "mongoose";

mongoose.connect(`${process.env.DB_URL}${process.env.DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
console.info("connected to db");
