import {QuestionModel} from "../models/QuestionModel.js";
import { standardResponse } from "../helper/helper.js";


export const CreateQuiz = (req, res) => {
    try{
        const {Name, courseid, timer, thresholdTime, questions} = req.body;
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

