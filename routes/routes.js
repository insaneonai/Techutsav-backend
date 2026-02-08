"use strict";

import express from "express";
import * as constants from "../constants.js";
import {
  signupUser,
  verifyEmail,
  resendEmail,
  loginUser,
  loginUserDefaultNext,
  forgotPassword,
  resetPassword,
  getProfile,
} from "../controller/Usercontroller.js";

const router = express.Router();

router.post("/user/signup", signupUser);

router.post("/user/login", loginUser, loginUserDefaultNext);

router.get("/user/profile", loginUser, getProfile);

router.get("/verify", verifyEmail);

router.get("/resend-email", resendEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/proxy-payment", loginUser, (req, res) => {
  res.redirect(`https://eazypay.icicibank.com/homePage`);
});

export default router;
