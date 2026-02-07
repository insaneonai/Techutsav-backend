"use strict"

import mongoose from "mongoose"

const {Schema, model} = mongoose;

const TopicSchema = new Schema({
    Name: {type: String, required:"Name of the Topic is required", unique: true},
    Question: [{type: Schema.Types.ObjectId, ref: "Question"}],
    Assignment: [{type: Schema.Types.ObjectId, ref: "Assignment"}],
    Material: [{type: Schema.Types.ObjectId, ref:"Material", required: "Course Material is required"}],
    LockedMaterial: [{type: Schema.Types.ObjectId, ref:"LockedMaterial"}]
}, {timestamps: true});

export const TopicModel = model("Topics", TopicSchema);