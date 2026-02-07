"use strict";

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CollegeSchema = new Schema(
  {
    name: { type: String, required: "College Name Required" },
    isVerified: { type: Boolean, default: false },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const CollegeModel = model("College", CollegeSchema);
