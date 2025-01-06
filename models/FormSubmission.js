"use strict"

import mongoose from "mongoose";


const {Schema, model} = mongoose;

const FormSubmissionSchema = new Schema({
    email: {type: String, required: "Email Required"},
    gender: {type: String, required: "Name Required"},
    thirstForChallenges: {type: String, required: "Required"},
    selfCompetition: {type: String, required: "Required"},
    achievingGoals: {type: String, required: "Required"},
    exploringTreasures: {type: String, required: "Required"},
    lockedDoors: {type: String, required: "Required"},
    gameLore: {type: String, required: "Required"},
    cooperatingStrangers: {type: String, required: "Required"},
    groupPlay: {type: String, required: "Required"},
    shareSuccess: {type: String, required: "Required"},
    oneOnOneOpponent: {type: String, required: "Required"},
    competitiveMatches: {type: String, required: "Required"},
    defeatingRivals: {type: String, required: "Required"},
}, {timestamps: true});

export const FormSubmissionModel = model("FormSubmission", FormSubmissionSchema);