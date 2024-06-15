"use strict";

import mongoose from "mongoose";
import { hash } from 'bcrypt';
import * as constants from "../constants.js";
import { sendVerificationLink } from "../helper/helper.js"
const {Schema, model} = mongoose;

const TeacherSchema = new Schema({
    Name: {type: String, required: "Name of Teacher is Required"},
    Department: {type: String, required: "Name of Department Required"},
    Courses: [{type: Schema.Types.ObjectId, ref: "Courses"}],
    email: {type: String, required:"Email Required.", unique: true},
    HashEmail: {type: String, required: "Hash of Email is Required"},
    password: {type: String, required: "Password Required."},
    accessToken: {type: String, default: "", unique:false},
    authCode: {type: String, default:"", unique:false},
    isVerified: {type: Boolean, default: false},
    OTP: {type: Number}
});

TeacherSchema.pre("save", async function (next) {
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

export const TeacherModel = model("Teacher", TeacherSchema);