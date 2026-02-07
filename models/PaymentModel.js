"use strict";
import mongoose from "mongoose";
const { Schema, model } = mongoose;
const paymentSchema = new Schema(
  {userId: {type: mongoose.Schema.Types.ObjectId,ref: "Users",required: true},
    TXNID: {type: String,required: true,unique: true},
    amount: {type: Number,required: true},
    passType: {type: String,enum: ["EVENT", "PAPER", "IDEATHON"],required: true},
    screenshotUrl: {type: String,required: true},
    screenshotMimeType: {type: String, required: true },
    status: {type: String,enum: ["PENDING", "APPROVED", "REJECTED"],default: "PENDING"},
},
  { timestamps: true }
);
export const PaymentModel = model("payment_info", paymentSchema);
