'use strict';

import mongoose from "mongoose";

const {Schema, model} = mongoose;


const QuestionSchema = new Schema({
    Timer : {type: Number},
    ThresholdTime: {type: Number},
    questionType: {type:Number, enum: [0,1], required:"Question Type Required."},   // [0: "MCQ", 1: "Descriptive"]
    question: {type: String, required: "Question Required."},
    options: {type: Array},
    questionByLevel : {type: Number, enum: [0,1]}, // [0: "Conceptual", 1: "Applied"]
    Difficulty: {type: String, enum: ["Easy", "Average", "Hard"], required:"difficulty required"},
    hasimg: {type: Boolean, required: "Has Img is required"},
    point: {type: Number, required: "Points is Required", default: 1},
    answerOption: {type: Number},
    answerDescription: {type: String},
    imgsrc: {type: String, default: ""}, 
    Badge: {type: String, default: ""},
},{timestamps: true});

QuestionSchema.pre("save", async function (next) {
    const question = this;
    if (
        (question.questionType === 0 && (!question.options || !question.answerOption)) ||
        (question.questionType === 1 && !question.answerDescription)
    ) {
        const error = new Error("Required fields are missing.");
        return next(error);
    }
    console.log("Save done!");
    next();
});



export const QuestionModel = model('Questions', QuestionSchema);

