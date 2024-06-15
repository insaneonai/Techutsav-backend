'use strict';

import express from 'express';
import * as constants from "../constants.js";
import {signupStudent, verifyStudent, loginStudent, resendAuthCodeStudent, getOTPStudent, isOTPValidStudent, resetPasswordStudent, TrueResponse, getStudent, joinCourse, getMyCourses} from '../controller/Studentcontroller.js';
import { signupTeacher, verifyTeacher, loginTeacher, resendAuthCodeTeacher, getOTPTeacher, isOTPValidTeacher, resetPasswordTeacher, getTeacher } from '../controller/Teachercontroller.js';
import { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, addStudentToCourse, addStudentToCourseBulk, removeStudentFromCourse } from '../controller/CourseController.js';
import {addtoTopics, createTopics, getMyTopicsStudent, getMyTopicsTeacher, removeTopics, submitAssignment, createQuiz, removefromQuiz} from '../controller/TopicController.js';
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
    loginStudent);

router.get(
    '/getStudent',
    loginStudent,
    getStudent
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
    upload.fields([{name: 'Assignment', maxCount: 1}, {name: 'Material', maxCount: 1}]),
    createTopics
)

router.get(
    '/getAllTopics/student',
    loginStudent,
    getMyTopicsStudent
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
    upload.fields([{name: 'Assignment', maxCount: 1}, {name: 'Material', maxCount: 1}]),
    addtoTopics
)

router.post(
    '/submitAssignment',
    loginStudent,
    upload.single('Submission'),
    submitAssignment
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
    '/generate',
    loginStudent,
    generate)

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

