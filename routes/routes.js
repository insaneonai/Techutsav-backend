'use strict';

import express from 'express';
import * as constants from "../constants.js";
import {signupStudent, verifyStudent, loginStudent, resendAuthCodeStudent, getOTPStudent, isOTPValidStudent, resetPasswordStudent, TrueResponse, getStudent, joinCourse, getMyCourses, loginStudentDefaultNext, setPreference, updateElements, AddTodo, submitForm} from '../controller/Studentcontroller.js';
import { signupTeacher, verifyTeacher, loginTeacher, resendAuthCodeTeacher, getOTPTeacher, isOTPValidTeacher, resetPasswordTeacher, getTeacher } from '../controller/Teachercontroller.js';
import { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, addStudentToCourse, addStudentToCourseBulk, removeStudentFromCourse, getLeaderBoard } from '../controller/CourseController.js';
import {addtoTopics, createTopics, getMyTopicsStudent, getMyTopicsTeacher, removeTopics, submitAssignment, createQuiz, removefromQuiz, evaluateAssignment, getSubmittedAssignments, evaluateQuiz, isQuizAttempted, unlockMaterial} from '../controller/TopicController.js';
import multer from 'multer';
//import {PostQuestion, GetAllQuestion} from '../controller/QAcontroller.js';

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // no larger than 5mb
    }});

const router = express.Router();

router.post(
    "/signup/student",
    signupStudent);

router.post(
    "/login/student",
    loginStudent,
    loginStudentDefaultNext);

router.get(
    '/getStudent',
    loginStudent,
    getStudent
)

router.post(
    '/setPreference/student',
    loginStudent,
    setPreference
)

router.post(
    '/updateElements',
    loginStudent,
    updateElements
)

router.post(
    '/evaluateQuiz',
    loginStudent,
    evaluateQuiz
)

router.get(
    '/verify/student',
    verifyStudent);

router.post(
    '/resendCode/student',
    resendAuthCodeStudent
)

router.post(
    '/getOTP/student',
    getOTPStudent
)

router.post(
    '/isOTPValid/student',
    isOTPValidStudent,
    TrueResponse
)
router.post(
    '/resetPassword/student',
    isOTPValidStudent,
    resetPasswordStudent
)

router.post(
    "/signup/teacher",
    signupTeacher);

router.post(
    "/login/teacher",
    loginTeacher);
    
router.get(
    '/getTeacher',
    loginTeacher,
    getTeacher
)
    

router.get(
    '/verify/teacher',
    verifyTeacher);

router.post(
    '/resendCode/teacher',
    resendAuthCodeTeacher
)

router.post(
    '/getOTP/teacher',
    getOTPTeacher
)

router.post(
    '/isOTPValid/teacher',
    isOTPValidTeacher,
    TrueResponse
)
router.post(
    '/resetPassword/teacher',
    isOTPValidTeacher,
    resetPasswordTeacher
)

router.post(
    '/createCourse',
    loginTeacher,
    createCourse
)

router.get(
    '/getAllCourses',
    loginTeacher,
    getAllCourses
)

router.get(
    '/getCourseById',
    loginTeacher,
    getCourseById
)

router.patch(
    '/updateCourse',
    loginTeacher,
    updateCourse
)

router.delete(
    '/deleteCourse',
    loginTeacher,
    deleteCourse
)

router.post(
    '/addStudentsToCourse',
    loginTeacher,
    addStudentToCourse
)

router.post(
    '/addStudentsToCourseBulk',
    loginTeacher,
    addStudentToCourseBulk
)

router.delete(
    '/removeStudentFromCourse',
    loginTeacher,
    removeStudentFromCourse
)


router.post(
    '/joinCourse',
    loginStudent,
    joinCourse
)

router.get(
    '/getMyCourses',
    loginStudent,
    getMyCourses
)

router.post(
    '/createTopics',
    loginTeacher,
    upload.fields([{name: 'Assignment', maxCount: 1}, {name: 'Material', maxCount: 1},  {name: 'LockedMaterial', maxCount: 1}]),
    createTopics
)

router.post(
    '/getAllTopics/student',
    loginStudent,
    getMyTopicsStudent
)

router.post(
    '/getSubmitedAssignments/student',
    loginStudent,
    getSubmittedAssignments
)

router.get(
    '/logout',
    (req, res) => {
        res.clearCookie('Authentication');
        res.clearCookie('Authemail');
        res.status(200).send("Logged out successfully");
    }
)

router.get(
    '/getAllTopics/teacher',
    loginTeacher,
    getMyTopicsTeacher
)

router.get(
    '/getAllTopics/student',
    loginStudent,
    getMyTopicsStudent
)

router.patch(
    '/AddtoTopics',
    loginTeacher,
    upload.fields([{name: 'Assignment', maxCount: 1}, {name: 'Material', maxCount: 1}, {name: 'LockedMaterial', maxCount: 1}]),
    addtoTopics
)

router.post(
    '/AddTodo',
    loginStudent,
    AddTodo
)

router.patch(
    '/UnlockMaterial/student',
    loginStudent,
    unlockMaterial
)

router.post(
    '/submitAssignment',
    loginStudent,
    upload.single('Submission'),
    submitAssignment
)

router.post(
    '/evaluateAssignment',
    loginTeacher,
    evaluateAssignment
)

router.post(
    '/submitForm',
    submitForm
)

router.post(
    '/isQuizAttempted',
    loginStudent,
    isQuizAttempted
)

router.get(
    '/getLeaderboard',
    loginStudent,
    getLeaderBoard
)

router.post(
    '/isquizAttempted/student',
    loginStudent,
    isQuizAttempted
)

router.post(
    '/createQuiz',
    loginTeacher,
    createQuiz

)

router.delete(
    '/deleteTopics',
    loginTeacher,
    removeTopics
)

router.delete(
    '/removeFromQuiz',
    loginTeacher,
    removefromQuiz
)

/*
router.post(
    '/postQuestion',
    loginStudent,
    PostQuestion
)

router.post(
    '/getallQuestions',
    loginStudent,
    GetAllQuestion
)
*/

export default router;

