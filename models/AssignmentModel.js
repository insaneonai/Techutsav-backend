"use strict"

import mongoose from "mongoose"

const {Schema, model} = mongoose;

const AssignmentSchema = new Schema({
    Name: {type: String, required: "Name is required."},
    URL: {type: String, required: "Url is required."},
    Difficulty: {type: String, enum: ["Easy", "Average", "Hard"], required:"difficulty required"},
    Responses: [{type: Schema.Types.ObjectId, ref: "Assignment Submission"}]
}, {timestamps: true})

export const AssignmentModel = model("Assignment", AssignmentSchema);