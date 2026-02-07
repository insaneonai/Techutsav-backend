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
import { createEvent } from "../controller/Eventcontroller.js";
import { getAllEvents } from "../controller/Eventcontroller.js";
import { updateEvent } from "../controller/Eventcontroller.js";
import { getMyEvents } from "../controller/Eventcontroller.js";
import { createCollege, deleteCollege, getAllColleges, updateCollege } from "../controller/Collegecontroller.js";
import { registerEvent } from "../controller/EventRegistrationController.js";
import { getRegisteredEvents } from "../controller/EventRegistrationController.js";
//import {PostQuestion, GetAllQuestion} from '../controller/QAcontroller.js';

const router = express.Router();

router.post("/user/signup", signupUser);

router.post("/user/login", loginUser, loginUserDefaultNext);

router.get("/verify", verifyEmail);

router.get("/resend-email", resendEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post("/event/create", loginUser, createEvent);

router.post("/college/create",createCollege);

router.get("/college/all", getAllColleges);

router.put("/college/update/:id", updateCollege);

router.delete("/college/delete/:id", deleteCollege);

router.get("/event/all", getAllEvents);

router.put("/event/update/:eventId", loginUser, updateEvent);

router.get("/event/my-events", loginUser, getMyEvents);

router.post("/event/register/:eventId", loginUser, registerEvent);

router.get("/event/registered-events", loginUser, getRegisteredEvents);


export default router;
