"use strict";

import express from "express";

import {
  signupUser,
  verifyEmail,
  resendEmail,
  loginUser,
  loginUserDefaultNext,
  forgotPassword,
  resetPassword,
} from "../controller/Usercontroller.js";
import {
  uploadPaymentInfo,
  viewAllPayments,
  updatePaymentStatus,
} from "../controller/PaymentController.js";



import { createEvent } from "../controller/Eventcontroller.js";
import { getAllEvents } from "../controller/Eventcontroller.js";
import { updateEvent } from "../controller/Eventcontroller.js";
import { getMyEvents } from "../controller/Eventcontroller.js";
import { createCollege, deleteCollege, getAllColleges, updateCollege } from "../controller/Collegecontroller.js";
import { registerEvent } from "../controller/EventRegistrationController.js";
import { getRegisteredEvents } from "../controller/EventRegistrationController.js";
import { upload } from "../middleware/upload.js";

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

router.post("/Upload-Payment-Info",loginUser,upload.single("screenshot"),uploadPaymentInfo);

router.get("/View-All-Payments",loginUser,(req, res, next) =>
   {
    if (req.user.role !== "PaymentAdmin") {
      return res
        .status(403)
        .json(standardResponse(403, "Access denied"));
    }
    next();
  },
  viewAllPayments
);

router.put(
  "/Update-Payment-Status/:paymentId",loginUser,(req, res, next) => 
    {
    if (req.user.role !== "PaymentAdmin") {
      return res
        .status(403)
        .json(standardResponse(403, "Access denied"));
    }
    next();
  },
  updatePaymentStatus
);


export default router;
