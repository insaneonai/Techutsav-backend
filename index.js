"use strict";

import "dotenv/config";
import express from "express";
import * as database from "./database/db.js";
import router from "./routes/routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET", "PATCH", "DELETE"],
    credentials: true,
  }),
);
app.use("/api", router);

app.get("/", (req, res) => {
  res.status(404).send("Vanakam da mapla!!!");
});

app.listen(8080, process.env.HOST, () => {
  console.log(`Example app listening on port 8080`);
});
