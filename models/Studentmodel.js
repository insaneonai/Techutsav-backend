"use strict";

import mongoose from 'mongoose';
import { hash } from 'bcrypt';
import * as constants from "../constants.js";
import { sendVerificationLink } from "../helper/helper.js"
const { Schema, model } = mongoose;

const userSchema = new Schema({
    Name: {type: String, required: "Name Required"},
    regno: {type: String, required: "Regno Required"},
    department: {type: String, required: "Department Required"},
    totalCoins: {type: Number, default: 0},
    hearts: {type: Number, default: 0, max: 5},
    totalKey: {type: Number, default:0},
    Courses: [{type: Map, of: [String]}],  // CourseId: [Points, Level];
    preferenceId: {type: Schema.Types.ObjectId, ref: "Preferences"},
    preference: {type: String},
    email: {type: String, required:"Email Required.", unique: true},
    HashEmail: {type: String, required: "Hash of Email is Required"},
    password: {type: String, required: "Password Required."},
    accessToken: {type: String, default: "", unique:false},
    authCode: {type: String, default:"", unique:false},
    isVerified: {type: Boolean, default: false},
    OverallPoints: {type: Number, default: 0},
    Todo: [{type: String}, {unique: true}],
    formSubmission: {type: Boolean, default: false},
    OTP: {type: Number}
},{timestamps: true})

userSchema.pre("save", async function (next) {
  const user = this;
  try {
      if (user.isModified('authCode')){
          sendVerificationLink(user.email, user.authCode);
      }
      if (user.isModified('password')) {
          const hashedPassword = await new Promise((resolve, reject) => {
              hash(user.password, constants.saltRounds, function(err, hash) {
                  if (err) reject(err)
                  resolve(hash)
              });
          });
          user.password = hashedPassword;
      }
      next();
  } catch (error) {
      console.error(error);
      next(error);
  }
});

export const StudentModel = model("Student", userSchema);
