"use strict"

import mongoose from "mongoose"


const {Schema, model} = mongoose;

const CourseSchema = new Schema({
    Name: {type: String, required:"Name of the course is required"},
    Department: {type: String, required: "Name of the Department is required."},
    Handle: {type: String, required: "Name of the Handling Staff Required."},
    Description: {type: String},
    Topics: [{type: Schema.Types.ObjectId, ref:"Topics", unique: true}],
    CourseId: {type: String, required: "Course Id is required"},
    Students: [{type: Schema.Types.ObjectId, ref:"Student"}]
}, {timestamps: true});

export const CourseModel = model("Courses", CourseSchema);

