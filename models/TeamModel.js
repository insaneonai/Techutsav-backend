"use strict";

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const TeamSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    teamName: { type: String, required: "Team Name Required" },
    leaderUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamCode: { type: String, required: "Team Code Required", unique: true },
    isLocked: { type: Boolean, default: false }, // becomes true when team is full or registration deadline has passed
  },
  { timestamps: true },
);

export const TeamModel = model("Team", TeamSchema);
