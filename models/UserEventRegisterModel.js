"use strict";

import mongoose from "mongoose";
const { Schema, model } = mongoose;


const UserEventRegisterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    status: { type: String, enum: ["Registered","Participated","Winner"], default: "Registered" },
    rank: { type: Number }, // position secured in the event
  },
  { timestamps: true },
);

export const UserEventRegisterModel = model("UserEventRegister", UserEventRegisterSchema);
