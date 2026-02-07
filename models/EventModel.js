"use strict";

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const EventSchema = new Schema(
  {
    name: { type: String, required: "Event Name Required" },
    department: { type: String, required: "Department Name Required" },
    description: { type: String, required: "Event Description Required" },
    ruleBookUrl: { type: String, required: "Rulebook URL Required" },
    prizesInfo: { type: String, required: "Prizes Info Required" },
    ruleDescription: { type: String, required: "Rule Description Required" },
    orgContact: { type: String, required: "Organizer Contact Required" },
    category: { type: String, enum: ["Online", "Offline"], required: "Event Category Required" },
    posterUrl: { type: String, required: "Poster URL Required" },
    isTeamEvent: { type: Boolean, default: false },
    venue: { type: String },
    date: { type: Date , required: "Event Date Required"},
    time: { type: String , required: "Event Time Required"},
    maxTeamSize: { type: Number, default: 1 },
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const EventModel = model("Event", EventSchema);
