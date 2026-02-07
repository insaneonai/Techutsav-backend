import mongoose from "mongoose";

const {Schema, model} = mongoose;

const QuizSubmissionSchema = new Schema({
    StudentId: {type: Schema.Types.ObjectId, ref: "Student", required: "StudentId Required"},
    TopicId: {type: Schema.Types.ObjectId, ref: "Topics", required: "TopicId Required"},
    CourseId: {type: String, required: "CourseId Required"},
    questionId: {type: Schema.Types.ObjectId, ref: "Questions", required: "QuizId Required"},
    AnswerDescriptive: {type: String},
    AnswerMCQ: {type: Number},
    Score: {type: Number, default: 0},
    malpractice: {type: Boolean, default: false}
}, {timestamps: true});

export const QuizSubmissionModel = model("QuizSubmission", QuizSubmissionSchema);
