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
} from "../controller/Usercontroller.js";
//import {PostQuestion, GetAllQuestion} from '../controller/QAcontroller.js';

const router = express.Router();

router.post("/signup/user", signupUser);

router.post("/login/user", loginUser, loginUserDefaultNext);

router.get("/verify", verifyEmail);

router.get("/resend-email", resendEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/proxy-payment", loginUser, (req, res) => {
  res.redirect(`https://eazypay.icicibank.com/homePage`);
});

export default router;
