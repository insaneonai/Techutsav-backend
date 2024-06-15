"use strict"

import mongoose from "mongoose"

const {Schema, model} = mongoose;

const MaterialSchema = new Schema({
    URL: {type: String, required: "Url is required."},
    Difficulty: {type: String, enum: ["Easy", "Average", "Hard"], required:"difficulty required"}
})

export const MaterialModel = model("Material", MaterialSchema);