"use strict";

import mongoose from "mongoose";
import { hash } from "bcrypt";
import { sendVerificationLink } from "../helper/helper.js";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: "Name Required" },
    email: { type: String, required: "Email Required", unique: true },
    isEmailVerified: { type: Boolean, default: false },
    emailAuthCode: { type: String },
    password: { type: String, required: "Password Required" },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: "College ID Required",
    },
    phoneNo: { type: String, required: "Phone Number Required" },
    year: { type: Number, required: "Year Required" },
    department: { type: String, required: "Department Required" },
    role: {
      type: String,
      enum: ["participant", "EventOrganizer", "PaymentAdmin"],
      default: "participant",
    },
    organizerEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  const user = this;
  try {
    if (user.isModified("password")) {
      const hashedPassword = await new Promise((resolve, reject) => {
        hash(
          user.password,
          parseInt(process.env.SALT_ROUNDS),
          function (err, hash) {
            if (err) reject(err);
            resolve(hash);
          },
        );
      });
      user.password = hashedPassword;
    }
    if (user.isModified("emailAuthCode")) {
      sendVerificationLink(user.email, user.emailAuthCode);
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export const UserModel = model("Users", userSchema);
