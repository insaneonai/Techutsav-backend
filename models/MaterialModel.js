"use strict"

import mongoose from "mongoose"

const {Schema, model} = mongoose;

const MaterialSchema = new Schema({
    Name: {type: String, required: "Name is required."},
    URL: {type: String, required: "Url is required."},
    Difficulty: {type: String, enum: ["Easy", "Average", "Hard"], required:"difficulty required"}
}, {timestamps: true})

export const MaterialModel = model("Material", MaterialSchema);