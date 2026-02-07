import mongoose from "mongoose";

const {Schema, model} = mongoose;

const SubmissionSchema = new Schema({
    studentId: {type: Schema.Types.ObjectId, ref: "Student", required: "Student ID is required"},
    questionAssignment: {type: Schema.Types.ObjectId, ref: "Assignment", required: "Question Assignment is required"},
    submissionURL: {type: String, required: "Submission URL is required"},
    Marks: {type: Number, default: 0}
}, {timestamps: true});

export const SubmissionModel = model("Assignment Submission", SubmissionSchema);