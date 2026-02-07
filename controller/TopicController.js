import { TopicModel } from '../models/TopicsModel.js';
import { TeacherModel } from '../models/TeacherModel.js';
import { StudentModel } from '../models/Studentmodel.js';
import { CourseModel } from '../models/CourseModel.js';
import { MaterialModel } from '../models/MaterialModel.js';
import { AssignmentModel } from '../models/AssignmentModel.js';
import { QuestionModel } from '../models/QuestionModel.js';
import { SubmissionModel } from '../models/AssignmentSubmission.js';
import { predictLearnerLevel, standardResponse } from '../helper/helper.js';
import { minioConfig, Bucket } from '../constants.js';
import * as Minio from 'minio'
import { QuizSubmissionModel } from '../models/QuizSubmission.js';
import { LockedMaterialModel } from '../models/LockedMaterialModel.js';

const minioClient = new Minio.Client(minioConfig);

const TopicSampler = async (difficulty, CourseId, limit, studentId) =>
    {
    let courseTopics = await CourseModel.findOne({"CourseId": CourseId}, {"Students": 0, "updatedAt": 0, "createdAt": 0, "__v": 0}).populate({
    path: "Topics",
    select:  ["-createdAt", "-__v"],
    populate: [
        {
            path: "Material",
            model: "Material",
            sampleSize: limit,
            random: true,
            select: ["-_id", "-updatedAt", "-createdAt", "-__v"]
        },
        {
            path: "Assignment",
            model: "Assignment",
            match: {"Difficulty": difficulty},
            sampleSize: limit,
            random: true,
            select:  ["-updatedAt", "-createdAt", "-__v", "-Responses"]
        },
        {
            path: "Question",
            model: "Questions",
            match: {"Difficulty": difficulty},
            sampleSize: limit,
            random: true,
            select:  ["-updatedAt", "-createdAt", "-__v", "-answerOption", "-answerDescription"]
        },
        {
            path: "LockedMaterial",
            model: "LockedMaterial",
            select: ["-updatedAt", "-createdAt", "-__v"]
        }
    ]
    });

    courseTopics = courseTopics.toJSON();

    const quizAttemptedPromises = courseTopics.Topics.map(async (topic) => {
        const isAttempted = await isQuizAttempted(topic._id, studentId);
        return { ...topic, quizAttempted: isAttempted };
    });

    courseTopics.Topics = courseTopics.Topics.map((topic) => {
        topic.LockedMaterial = topic.LockedMaterial.map((material) => {
            const accessTo = material.accessTo.map(String);
            if (accessTo.includes(studentId.toString())){
                return {...material, accessTo: accessTo.includes(studentId.toString())};
            }
            else{
                return {...material, URL: null, accessTo: false};
            }
        });
        return topic;
    });
    
    courseTopics.Topics = await Promise.all(quizAttemptedPromises);

    return courseTopics
}

export const createTopics = async (req, res) => {
    try {
        const { Name, courseId, materialDifficulty, assignmentDifficulty } = req.body;
        const { Assignment, Material, LockedMaterial } = req.files;
        const { Authemail } = req.cookies;
        const teacher = await TeacherModel.findOne({ "HashEmail": Authemail }, { "_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0 }).populate("Courses", "CourseId");
        if (!teacher) {
            return res
                .status(404)
                .json(standardResponse(404, "You dont have access or Teacher not found.", null));
        }
        const containCourse = teacher.Courses.some((course) => course.CourseId == courseId);
        if (!containCourse) {
            return res
                .status(403)
                .json(standardResponse(403, "This Course Id isn't accessible.", null));
        }
        const course = await CourseModel.findOne({ "CourseId": courseId });
        if (!course) {
            return res
                .status(404)
                .json(standardResponse(404, "Course Not Found", null));
        }
        const existingTopic = await TopicModel.findOne({ Name: Name });
        if (existingTopic) {
            return res
                .status(400)
                .json(standardResponse(400, "Topic already exists", null));
        }
        if (!Name || !Material || !courseId) {
            return res
                .status(400)
                .json(standardResponse(400, "Name and Material and CourseId are required", null));
        }
        const newTopic = new TopicModel({
            Name: Name
        });

        const assignmentPromises = Assignment.map(async (assignment) => {
            await minioClient.putObject(Bucket, assignment.originalname, assignment.buffer);

            minioClient.presignedUrl('GET', Bucket, assignment.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newAssignment = new AssignmentModel({
                    Name: assignment.originalname,
                    URL: presignedUrl,
                    Difficulty: assignmentDifficulty
                });
                newAssignment.save();
                newTopic.Assignment.push(newAssignment._id);
            })
        });

        const materialPromises = Material.map(async (material) => {
            await minioClient.putObject(Bucket, material.originalname, material.buffer);
            minioClient.presignedUrl('GET', Bucket, material.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newMaterial = new MaterialModel({
                    Name: material.originalname,
                    URL: presignedUrl,
                    Difficulty: materialDifficulty
                });
                newMaterial.save();
                newTopic.Material.push(newMaterial._id);
            })
        });

        const LockedMaterialPromises = LockedMaterial.map(async (material) => {
            await minioClient.putObject(Bucket, material.originalname, material.buffer);
            minioClient.presignedUrl('GET', Bucket, material.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newLockedMaterial = new LockedMaterialModel({
                    Name: material.originalname,
                    URL: presignedUrl,
                    accessTo: []
                });
                newLockedMaterial.save();
                newTopic.LockedMaterial.push(newLockedMaterial._id);
            })
        });

        await Promise.all([...assignmentPromises, ...materialPromises, ...LockedMaterialPromises]);
        
        await newTopic.save();
        course.Topics.push(newTopic._id);
        await course.save();

        return res
            .status(200)
            .json(standardResponse(200, `Topic created ${Name}`, null));
    } catch (error) {
        console.log("Error in createTopics: ", error);
        return res
            .status(500)
            .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const removeTopics = async (req, res)=> {
    try{
        const {Authemail} = req.cookies;
        const {courseId, Name} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate({path : "Courses", populate:{"path": "Topics", model: "Topics"}});
        const course = teacher.Courses.filter((course) => course.CourseId == courseId)[0];
        if (!course){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const isTopic = course.Topics.some((topic) => topic.Name === Name);
        if (!isTopic){
            return res
            .status(403)
            .json(standardResponse(403, "You can't Modify this Topic", null));
        }
        const Topic = await TopicModel.findOne({"Name": Name}, {"_id": 1, "Material": 1, "Assignment": 1}).populate("Material").populate("Assignment");
        for (let material of Topic.Material){
            await MaterialModel.deleteOne({"_id": material._id});
        }
        for (let assignment of Topic.Assignment){
            await AssignmentModel.deleteOne({"_id": assignment._id});
        }
        await TopicModel.deleteOne({"Name": Name});
        course.Topics = course.Topics.filter((topic) => topic.Name !== Name);
        await CourseModel.findOneAndUpdate({"CourseId": courseId}, {"Topics": course.Topics});
        return res
        .status(200)
        .json(standardResponse(200, "Topic Deleted", {courseId, Name}));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`,  null));
    }
};

export const getMyTopicsStudent = async (req, res) => {
    try {
        const { Authemail } = req.cookies;
        const { CourseId } = req.body;
        const student = await StudentModel.findOne({ "HashEmail": Authemail }, { "_id": 1, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0 });
        if (!student) {
            return res
                .status(404)
                .json(standardResponse(404, "No access to student!", null));
        }
        const course = student.Courses.filter((course) => {
            return course.CourseId !== CourseId;
        })[0];

        if (course) {
            let learnerLevel = course.level; // Slow, Average, Fast Learner;
            const courseTopicsByDifficulty = {};
            for (let difficulty of ["Easy", "Average", "Hard"]) {
                if (learnerLevel === 0) {
                    // Slow Learner
                    if (difficulty === "Easy") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 8, student._id).Topics;
                    }
                    else if (difficulty === "Average") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 2, student._id).Topics;
                    }
                    else {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 0, student._id).Topics;
                    }
                }
                else if (learnerLevel === 1) {
                    // Average Learner
                    if (difficulty === "Easy") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 4, student._id);
                    }
                    else if (difficulty === "Average") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 4, student._id);
                    }
                    else {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 2, student._id);
                    }
                }
                else {
                    // Fast Learner
                    if (difficulty === "Easy") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 2, student._id);
                    }
                    else if (difficulty === "Average") {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 4, student._id);
                    }
                    else {
                        courseTopicsByDifficulty[difficulty] = await TopicSampler(difficulty, CourseId, 4, student._id);
                    }
                }
            }
            const courseTopics = {
                "Name": courseTopicsByDifficulty.Easy.Name,
                "Department": courseTopicsByDifficulty.Easy.Department,
                "Handle": courseTopicsByDifficulty.Easy.Handle,
                "Description": courseTopicsByDifficulty.Easy.Description,
                "CourseId": courseTopicsByDifficulty.Easy.CourseId,
                "Topics": {
                    "Easy": courseTopicsByDifficulty.Easy.Topics,
                    "Average": courseTopicsByDifficulty.Average.Topics,
                    "Hard": courseTopicsByDifficulty.Hard.Topics
                }
            }
            if (Object.keys(courseTopics).length === 0) {
                return res
                    .status(404)
                    .json(standardResponse(404, "No Topics Found", null));
            }
            return res
                .status(200)
                .json(standardResponse(200, "Topics", courseTopics));
        }
        else {
            return res
                .status(403)
                .json(standardResponse(403, "You don't have access to this course", null));
        }
    }
    catch (error) {
        console.log("Error in getTopics: ", error);
        return res
            .status(500)
            .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
}

export const getSubmittedAssignments = async (req, res) => {
    try {
        const {Authemail} = req.cookies;
        const student = await StudentModel.findOne({"HashEmail": Authemail}, {"_id": 1});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student not found", null));
        }
        const submission = await SubmissionModel.find({"studentId": student._id});
        return res
        .status(200)
        .json(standardResponse(200, "Submissions", submission));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
}

export const getMyTopicsTeacher = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {CourseId} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate("Courses", "CourseId");
        const isCourse = teacher.Courses.some((course) => course.CourseId == CourseId);
        if (isCourse){
            const courseTopics = await CourseModel.findOne({"CourseId": CourseId}, {"_id": 0, "Students": 0, "updatedAt": 0, "createdAt": 0, "__v": 0}).populate({
                path: "Topics",
                select:  ["-_id", "-updatedAt", "-createdAt", "-__v"],
                populate: [
                    {
                        path: "Material",
                        model: "Material",
                        select: ["-_id", "-updatedAt", "-createdAt", "-__v"]
                    },
                    {
                        path: "Assignment",
                        model: "Assignment",
                        select:  ["-updatedAt", "-createdAt", "-__v"]
                    },
                    {
                        path: "Question",
                        model: "Questions",
                        select:  ["-updatedAt", "-createdAt", "-__v"]
                    }
                ]
            });            return res
            .status(200)
            .json(standardResponse(200, "Topics", courseTopics));
        }
        else{
            return res
            .status(403)
            .json(standardResponse(403, "You don't have access to this course", null));
        }
    }
    catch(error){
        console.log("Error in getTopics: ", error);
        return res
            .status(500)
            .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const addtoTopics = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, Name, assignmentDifficulty, materialDifficulty} = req.body;
        let {Material, Assignment, LockedMaterial} = req.files;
        if (!Material){
            Material = [];
        }
        if (!Assignment){
            Assignment = [];
        }
        if (!LockedMaterial){
            LockedMaterial = [];
        }
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate({path : "Courses", populate:{"path": "Topics", model: "Topics"}});
        if (!teacher){
            return res
            .status(404)
            .json(standardResponse(404, "You dont have access or Teacher not found.", null));
        }
        const course = teacher.Courses.filter((course) => course.CourseId == courseId)[0];
        if (!course){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const isTopic = course.Topics.some((topic) => topic.Name === Name);
        if (!isTopic){
            return res
            .status(403)
            .json(standardResponse(403, "You can't Modify this Topic", null));
        }
        const topic = await TopicModel.findOne({"Name": Name}, {"Material": 1, "Assignment": 1, "LockedMaterial": 1});
        const AssignmentPromises = Assignment.map(async (assignment) => {
            await minioClient.putObject(Bucket, assignment.originalname, assignment.buffer);
            minioClient.presignedUrl('GET', Bucket, assignment.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newAssignment = new AssignmentModel({
                    Name: assignment.originalname,
                    URL: presignedUrl,
                    Difficulty: assignmentDifficulty
                });
                newAssignment.save();
                topic.Assignment.push(newAssignment._id);
            })
        });
        const MaterialPromises = Material.map(async (material) => {
            await minioClient.putObject(Bucket, material.originalname, material.buffer);
            minioClient.presignedUrl('GET', Bucket, material.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newMaterial = new MaterialModel({
                    Name: material.originalname,
                    URL: presignedUrl,
                    Difficulty: materialDifficulty
                });
                newMaterial.save();
                topic.Material.push(newMaterial._id);
            })
        })
        const LockedMaterialPromises = LockedMaterial.map(async (material) => {
            await minioClient.putObject(Bucket, material.originalname, material.buffer);
            minioClient.presignedUrl('GET', Bucket, material.originalname, function(err, presignedUrl) {
                if (err) {
                    return err;
                }
                const newLockedMaterial = new LockedMaterialModel({
                    Name: material.originalname,
                    URL: presignedUrl,
                    accessTo: []
                });
                newLockedMaterial.save();
                topic.LockedMaterial.push(newLockedMaterial._id);
            })
        });
        await Promise.all([...AssignmentPromises, ...MaterialPromises, ...LockedMaterialPromises]);
        await topic.save();
        return res
        .status(200)
        .json(standardResponse(200, "Topic Updated", topic));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const removefromTopics = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {CourseId, Name, AssignmentIds, MaterialsIds } = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate({path : "Courses", populate:{"path": "Topics", model: "Topics"}});
        const isCourse = teacher.Courses.some((course) => course.CourseId == CourseId);
        if (!isCourse){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const course = teacher.Courses.filter((course) => course.CourseId == CourseId)[0];
        const isTopic = course.Topics.some((topic) => topic.Name === Name);
        if (!isTopic){
            return res
            .status(403)
            .json(standardResponse(403, "You can't Modify this Topic", null));
        }
        const topic = await TopicModel.findOne({"Name": Name}, {"Material": 1, "Assignment": 1});
        await AssignmentModel.deleteMany({"_id": {$in: AssignmentIds}});
        topic.Assignment = topic.Assignment.filter((id) => AssignmentIds.includes(id));
        await MaterialModel.deleteMany({"_id": {$in: MaterialsIds}});
        topic.Material = topic.Material.filter((id) => MaterialsIds.includes(id));
        await topic.save();
        return res
        .status(200)
        .json(standardResponse(200, "Topic Updated", topic));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const unlockMaterial = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {MaterialId} = req.body;
        const student = await StudentModel.findOne({"HashEmail": Authemail}, {"_id": 1, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student not found", null));
        }
        const lockedMaterial = await LockedMaterialModel.findOne({"_id": MaterialId});
        lockedMaterial.accessTo.push(student._id);
        student.totalKey -= 1;
        await student.save();
        await lockedMaterial.save();
        return res
        .status(200)
        .json(standardResponse(200, "Material Unlocked", null));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
}

export const submitAssignment = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {AssignmentId} = req.body;
        const Submission = req.file;
        const student = await StudentModel.findOne({"HashEmail": Authemail}, {"_id": 1, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0});
        const assignment = await AssignmentModel.findOne({"_id":AssignmentId});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student not found", null));
        }
        if (!assignment){
            return res
            .status(404)
            .json(standardResponse(404, "Assignment Not Found", null));
        }
        await minioClient.putObject(Bucket, Submission.originalname, Submission.buffer);
        minioClient.presignedUrl('GET', Bucket, Submission.originalname, function(err, presignedUrl) {
            if (err) {
                return err;
            }
            const newSubmission = new SubmissionModel({
                studentId: student._id,
                questionAssignment: assignment._id,
                submissionURL: presignedUrl
            });
            newSubmission.save();
            assignment.Responses.push(newSubmission._id);
            assignment.save();
        })
        return res
        .status(200)
        .json(standardResponse(200, "Assignment Submitted", null));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const createQuiz = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, Name, timer, thresholdTime, questions} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate({path: "Courses", populate: {path: "Topics", model: "Topics"}});
        const course = teacher.Courses.filter((course) => course.CourseId == courseId)[0];
        if (!course){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const isTopic = course.Topics.some((topic) => topic.Name === Name);
        if (!isTopic){
            return res
            .status(403)
            .json(standardResponse(403, "You can't Modify this Topic", null));
        }
        const questionDocuments = questions.map((question) => {
            question.Timer = timer;
            question.ThresholdTime = thresholdTime;
            return question;
        });
        const docs = await QuestionModel.insertMany(questionDocuments);
        const insertIds = docs.map(d => d._id);
        const update = {
            $push: {
              Question: {
                $each: insertIds
              }
            }
          };
        const topic = await TopicModel.findOneAndUpdate({Name: Name}, update, {new: true});
        await topic.save();
        return res
        .status(200)
        .json(standardResponse(200, "Quiz Created", questionDocuments));

        
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null))
    }
};

export const removefromQuiz = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, Name, QuestionIds} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate({path: "Courses", populate: {path: "Topics", model: "Topics"}});
        const course = teacher.Courses.filter((course) => course.CourseId == courseId)[0];
        if (!course){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const isTopic = course.Topics.some((topic) => topic.Name === Name);
        if (!isTopic){
            return res
            .status(403)
            .json(standardResponse(403, "You can't Modify this Topic", null));
        }
        const topic = await TopicModel.findOne({Name: Name});
        await QuestionModel.deleteMany({_id: {$in: QuestionIds}});
        topic.Question = topic.Question.filter((question) => QuestionIds.includes(question));
        await topic.save();
        return res
        .status(200)
        .json(standardResponse(200, "Quiz Updated", null));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
};

export const evaluateAssignment = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {CourseId, ResponseId, Marks} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate("Courses", "CourseId");
        if (!teacher){
            return res
            .status(404)
            .json(standardResponse(404, "Teacher not found", null));
        }
        const course = teacher.Courses.filter((course) => course.CourseId == CourseId)[0];
        if (!course){
            return res
            .status(403)
            .json(standardResponse(403, "Invalid Course either the course doesn't exist or you don't have access.", null));
        }
        const AssignmentResponse = await SubmissionModel.findOne({"_id": ResponseId});
        if (!AssignmentResponse){
            return res
            .status(404)
            .json(standardResponse(404, "Assignment Response not found", null));
        }
        AssignmentResponse.Marks = Marks;
        await StudentModel.updateOne(
            { "_id": AssignmentResponse.studentId, "Courses.courseId": CourseId },
            { 
                $inc: {
                    "Courses.$.points": Marks,
                    totalCoins: Marks * 10
                }
            }
        );
        await AssignmentResponse.save();
        return res
        .status(200)
        .json(standardResponse(200, "Assignment Evaluated", null));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, `Internal Server Error: ${error}`, null));
    }
}

export const evaluateQuiz = async (req, res) => {
    try {

        const { Authemail } = req.cookies;
        const {answers, topicName, CourseId, tabswitch, timetaken} = req.body;
        
        const student = await StudentModel.findOne({ "HashEmail": Authemail }, { "_id": 1, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0 });
        if (!student) {
            return res
                .status(404)
                .json(standardResponse(404, "No access to student!", null));
        }
        const course = student.Courses.filter((course) => {
            return course.CourseId !== CourseId;
        })[0];

        if (!course) {
            return res
                .status(403)
                .json(standardResponse(403, "You don't have access to this course", null));
        }

        const Questions = await QuestionModel.find({_id : {$in: answers.map(a => a.questionId)}});
        const topicId = await TopicModel.findOne({Name: topicName});

        let totalMarks = 0;

        let answerResponses = [];

        for (let i = 0; i < answers.length; i++) {
            if (Questions[i].questionType === 0) {  // MCQ
                const answerResponse = {};
                answerResponse.StudentId = student._id;
                answerResponse.questionId = answers[i].questionId;
                answerResponse.CourseId = CourseId;
                answerResponse.TopicId = topicId.toJSON()._id;
                answerResponse.AnswerMCQ = answers[i].answer;
                answerResponse.malpractice = tabswitch;
                if (parseInt(answers[i].answer) === Questions[i].answerOption) {
                    answerResponse.Score = Questions[i].point;
                    totalMarks += Questions[i].point;
                    answers[i].iscorrect = true;
                }
                else{
                answers[i].iscorrect = false;
                }
                answerResponses.push(answerResponse);
            }
            // Descriptive
            /*else{
                if (answers[i].answer === Questions[i].answerOption) {
                    const answerResponse = {};
                    answerResponse.StudentId = student._id;
                    answerResponse.questionId = answers[i].questionId;
                    answerResponse.AnswerMCQ = answers[i].answer;
                    totalMarks += Questions[i].point;
                    answers[i].iscorrect = true;
                }
                else{
                answers[i].iscorrect = false;
                }
            }*/
        }

        const correctRatio = totalMarks / Questions.reduce((acc, curr) => acc + curr.point, 0);
        const questionCount = answers.length;

        const incorrectFrequency = {"conceptual": 0, "problem solving":0, "application": 0};

        for (let i = 0; i < answers.length; i++) {
            if (answers[i].iscorrect === false){
                if (Questions[i].questionByLevel === 0){
                    incorrectFrequency["conceptual"] += 1;
                }
                else if (Questions[i].questionByLevel === 1){
                    incorrectFrequency["problem solving"] += 1;
                }
                else{
                    incorrectFrequency["application"] += 1;
                }
            }
        }

        const incorrectType =  Object.keys(incorrectFrequency).reduce((a,b) => incorrectFrequency[a] > incorrectFrequency[b] ? a : b);

        const learnerLevelResponse = predictLearnerLevel({correctRatio, incorrectType, timetaken, questionCount});

        const learnerLevelMapping = {"slow learner": 0, "average learner": 1, "quick learner": 2};

        if (learnerLevelResponse){
            const learnerlevel = learnerLevelMapping[learnerLevelResponse];
            
            if (correctRatio < topicId.toJSON().PassPercentage){
                await StudentModel.updateOne(
                    {"_id": student._id, "Courses.courseId": CourseId},
                    {"$set": {
                        "Courses.$.level": learnerlevel
                        },
                    "$inc": {
                        "hearts": -1
                    }
                    }
                );
            }
            else{
                await StudentModel.updateOne(
                    {"_id": student._id, "Courses.courseId": CourseId},
                    {"$set": {
                        "Courses.$.level": learnerlevel
                    }
                    }
                );
            }
        }

        await QuizSubmissionModel.insertMany(answerResponses);

        await StudentModel.updateOne(
            { "_id": student._id, "Courses.courseId": CourseId },
            { 
                $inc: {
                    "Courses.$.points": totalMarks
                }
            });

        return res
        .status(200)
        .json(standardResponse(200, "Quiz Evaluated", {answers, totalMarks}));
    }

    catch(error) {
        console.log(error);
        return res
        .status(500)
        .json(standardResponse(500, `Error Check your input.`, null));
    }
}

export const isQuizAttempted = async (topicId, studentId) => {
    try{

        const QuizSubmission = await QuizSubmissionModel.find({"TopicId": topicId, "StudentId": studentId}).populate("questionId", "point");

        if (QuizSubmission.length > 0) {
            const totalScore = QuizSubmission.reduce((acc, curr) => acc + curr.Score, 0);
            const totalScorable = QuizSubmission.reduce((acc, curr) => acc + curr.questionId.point, 0);
            return {isQuizAttempted: true, totalScore: totalScore, totalScorable: totalScorable};
        }
        else{
            return {isQuizAttempted: false};
        }
    }
    catch(error){
        console.log(error);
        return {isQuizAttempted: false};
    }
}