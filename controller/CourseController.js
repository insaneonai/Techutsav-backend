import { standardResponse } from "../helper/helper.js";
import { CourseModel } from "../models/CourseModel.js";
import { TeacherModel } from "../models/TeacherModel.js";
import { StudentModel } from "../models/Studentmodel.js";
import e from "express";

export const createCourse = async (req, res) => {
    try{
        const {name, department, handle, description, courseId, user} = req.body;
        const newCourse = new CourseModel({
            "Name": name,
            "Department": department,
            "Handle": handle,
            "Description": description,
            "CourseId": courseId
        });

        const teacher = await TeacherModel.findOne({"email": user.email});

        if (!teacher){
            return res
            .status(404)
            .json(standardResponse(404, "Error Creating Course User Not Found", null));
        }

        await newCourse.save();

        teacher.Courses.push(newCourse._id);

        await teacher.save();

        return res
        .status(200)
        .json(standardResponse(200, "Course Created Successfully", newCourse));


    }
    catch(error){
        console.log("Error in creating course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Creating Course", null));
    }
}

export const getAllCourses = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate({path: "Courses", populate: {path: "Students", model: "Student"}});
        if (!teacher){
            return res
            .status(404)
            .json(standardResponse(404, "User Not Found", null));
        }
        return res
        .status(200)
        .json(standardResponse(200, "Courses Found", teacher.Courses));
    }
    catch(error){
        console.log("Error in getting courses", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Getting Courses", null));
    }
}

export const getCourseById = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0}).populate("Courses", "CourseId");     
        const containCourse = teacher.Courses.some((course) => course.CourseId == courseId);
        if (!(containCourse)){
            return res
            .status(403)
            .json(standardResponse(403, "This Course Id isn't accessible.", null));
        }
        const course = await CourseModel.findOne({"CourseId": courseId});
        if (!course){
            return res
            .status(404)
            .json(standardResponse(404, "Course Not Found", null));
        }

        if (course.Topics.length == 0){
            return res
            .status(200)
            .json(standardResponse(200, "Course Found", course));
        }
        else{
            const populatedCourse = await course.populate("Topics");
            return res
            .status(200)
            .json(standardResponse(200, "Course Found", populatedCourse));
        }
    }
    catch(error){
        console.log("Error in getting course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Getting Course", null));
    }
}

export const updateCourse = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {oldCourseId, newCourseId, name, department, handle, description} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        const iscourse = teacher.Courses.some((course) => course.CourseId == oldCourseId);
        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant modify this Course.", null));
        }

        const course = await CourseModel.findOne({"CourseId": oldCourseId});
        course.CourseId = newCourseId;
        course.Name = name;
        course.Department = department;
        course.Handle = handle;
        course.Description = description;
        await course.save();
        return res
        .status(200)
        .json(standardResponse(200, "Course Updated Successfully"));
    }
    catch(error){
        console.log("Error in updating course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Updating Course", null));
    }
}

export const deleteCourse = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        const iscourse = teacher.Courses.some((course) => course.CourseId == courseId);
        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant delete this Course.", null));
        }

        await CourseModel.findOneAndDelete({"CourseId": courseId}, (err, doc) => {
            if (err){
                console.log("Error Deleting Course", err);
                return res
                .status(500)
                .json(standardResponse(500, "Error Deleting Course", null));
            }
            teacher.Courses.pop(doc._id);
            teacher.save();
        });
        return res
        .status(200)
        .json(standardResponse(200, "Course Deleted Successfully", null));
    }
    catch(error){
        console.log("Error in deleting course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Deleting Course", null));
    }

}

export const addStudentToCourse = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, studentEmail} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        const iscourse = teacher.Courses.some((course) => course.CourseId == courseId);
        console.log("Adding Student to Course", iscourse, teacher.Courses, courseId);
        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant modify this Course.", null));
        }

        const student = await StudentModel.findOne({"email": studentEmail});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student Not Found", null));
        }

        const course = await CourseModel.findOne({"CourseId": courseId});
        if (course.Students.includes(student._id)){
            return res
            .status(403)
            .json(standardResponse(403, "Student Already in Course", null));
        }
        course.Students.push(student._id);
        await course.save();
        return res
        .status(200)
        .json(standardResponse(200, "Student Added Successfully", course));
    }
    catch(error){
        console.log("Error in adding student to course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Adding Student to Course", null));
    }
}

export const addStudentToCourseBulk = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, studentEmails} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        console.log("Adding Student to Course", teacher.Courses, courseId, studentEmails)
        const iscourse = teacher.Courses.some((course) => course.CourseId == courseId);
        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant modify this Course.", null));
        }
        studentEmails.forEach(async (studentEmail) => {
            const student = await StudentModel.findOne({"email":studentEmail});
            if (!student){
                return res
                .status(404)
                .json(standardResponse(404, `${studentEmail} is not recognized.`, null));
            }
            const course = await CourseModel.findOne({"CourseId": courseId});
            if (!course.Students.includes(student._id)){
                course.Students.push(student._id);
                await course.save();
                return res
                .status(200)
                .json(standardResponse(200, "Students Added Successfully", studentEmails));
            }
        })
    }
    catch(error){
        console.log("Error in adding student to course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Adding Student to Course", null));
    }
}

export const getLeaderBoard = async (req, res) => {
    try{
        const {level, CourseId} = req.query;
        if (!CourseId){
            const leaderboard = await StudentModel.aggregate([
                {
                 $match: {"isVerified": true}   
                },
                {
                  $addFields: {
                    OverallPoints: { $avg: "$Courses.points" }
                  }
                },
                {
                    $project: { Name: 1, OverallPoints: 1, _id: 0}
                },
                {
                  $sort: { OverallPoints: -1 }
                }
              ]);
            return res
            .status(200)
            .json(standardResponse(200, "Leaderboard Found", leaderboard));
        }
        else{
            const leaderboard = await StudentModel.aggregate([
                {
                  $match: {
                    "Courses.courseId": CourseId,
                    "Courses.level": parseInt(level)
                  }
                },
                {
                  $project: {
                    Name: 1, // Include the student's name
                    points: {
                      $filter: {
                        input: "$Courses",
                        as: "course",
                        cond: { $eq: ["$$course.courseId", CourseId] } // Filter courses by courseId
                      }
                    }
                  }
                },
                {
                  $unwind: "$points" // Unwind the filtered points array
                },
                {
                  $sort: { "points.points": -1 } // Sort by points in descending order
                },
                {
                  $project: {
                    Name: 1,
                    "points.points": 1 // Select only the name and the points
                  }
                }
              ]);
              
            return res
            .status(200)
            .json(standardResponse(200, "Leaderboard Found", leaderboard));
        }

    }
    catch(error){
        console.log("Error in getting leaderboard", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Getting Leaderboard", null));
    }
}

export const removeStudentFromCourse = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId, studentEmail} = req.body;
        const teacher = await TeacherModel.findOne({"HashEmail": Authemail}).populate("Courses");
        const iscourse = teacher.Courses.some((course) => course.CourseId == courseId);
        if (!iscourse){
            return res
            .status(403)
            .json(standardResponse(403, "You cant modify this Course.", null));
        }

        const student = await StudentModel.findOne({"email": studentEmail});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student Not Found", null));
        }

        const course = await CourseModel.findOne({"CourseId": courseId});
        console.log("Removing Student from Course", course.Students, student._id);
        if (!(course.Students.includes(student._id))){
            return res
            .status(403)
            .json(standardResponse(403, "Student Not in Course", null));
        }
        course.Students.pop(student._id);
        await course.save();
        return res
        .status(200)
        .json(standardResponse(200, "Student Removed Successfully", course));
    }
    catch(error){
        console.log("Error in removing student from course", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Removing Student from Course", null));
    }
}