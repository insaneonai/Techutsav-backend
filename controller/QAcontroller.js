import {QuestionModel} from "../models/QuestionModel.js";
import { standardResponse } from "../helper/helper.js";


export const CreateQuiz = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {Name, courseid, timer, thresholdTime} = req.body;

        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        if (!teacher){
            return res
            .status(404)
            .json(standardResponse(404, "Teacher Not Found!"));
        }

        const iscourse = teacher.Courses.some((course) => course.CourseId == courseid);

        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant access the course!"));
        }

        const questions = req.body.questions.map((questions) => {
            return {
                timer: timer,
                thresholdTime: thresholdTime,
                ...questions
            }
        });

        const quiz = await QuestionModel.insertMany(questions);

        await QuestionModel.save();

        const topic = TopicModel.findOne({"Name": Name});

        if (!topic){
            return res
            .status(404)
            .json(standardResponse(404, "Topic Not Found!"));
        }

        quiz.forEach((question) => {
            topic.question.push(question._id);
        })

        await topic.save();

        return res
        .status(200)
        .json(standardResponse(200, "Quiz Created Successfully!", quiz));

        /*//{
        //     "Name": "Topic Name",
        //     "courseid": "Course ID",
        //     "timer": 60,
        //     "thresholdTime": 30,
        //     "questions": [
        //                {"question": "What is 2+2?", 
                           "questionType": 0, 
                           "options": ["1", "2", "3", "4"], 
                           "hasimg": false, 
                           "imgsrc": "", 
                           "point": 1, 
                           "answerOption": 3, 
                           "answerDescription": ""},
        ]*/




    }

    catch(error){
        return res
        .status(422)
        .json(standardResponse(422, "Unable to create Quiz!"));
    }
}

export const PostQuestion = (req, res) => { // lets keep it simple and only support single insertion.
    try{
        const {courseid, 
            testid, 
            questionType,
            question,
            options,
            hasimg,
            imgsrc,
            point,
            answerOption,
            answerDescription} = req.body;

        const Question = QuestionModel({
            'courseid': courseid,
            'testid': testid,
            'questionType': questionType,
            'question': question,
            'options': questionType===0 ? options : [],
            'hasimg': hasimg,
            'imgsrc': hasimg===true?imgsrc:null,
            'point': point,
            'answerOption': answerOption,
            'answerDescription': answerDescription
        });


        Question.save();

        return res
        .status(200)
        .json(standardResponse(200, "Question & Answer Saved Successfully", null));

    }

    catch(error){
        return res
        .status(422)
        .json(standardResponse(422, "Unable to save Question!"));
    }

}

export const GetAllQuestion = async (req, res) => {
    try{
        const {courseid, testid} = req.body;
        const questions = await QuestionModel.find({
            'courseid': courseid,
            'testid': testid
        }).select({'answerOption':0, 'answerDescription': 0});  // All Set of Questions for a test.

        return res
        .status(200)
        .json(standardResponse(200, "Retrived All Questions!", questions))

    }

    catch(error){
        return res
        .status(422)
        .json(standardResponse(422, "Unable to get all Question!"));
    }
}

