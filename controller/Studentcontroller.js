import { StudentModel } from "../models/Studentmodel.js"
import { CourseModel } from "../models/CourseModel.js";
import { compare } from 'bcrypt';
import * as constants from "../constants.js";
import { standardResponse, 
        generateAccessToken, 
        generateAuthToken, 
        VerifyAuthToken, 
        generateLoginToken,
        emailRegexp,
        generateOTP, 
        sendOTP,
        authEmailHasher} from "../helper/helper.js";

export const signupStudent = async (req, res) => {
    try{
        const {email, password, name, regno, department} = req.body;
        if (!emailRegexp.test(email)){
            return res
            .status(400)
            .json(standardResponse(400, "Invalid Email ID. Please provide a valid email address."));
        }
        const existingUser = await StudentModel.findOne({'email': email});
        if (existingUser){
            if (existingUser.isVerified){
                return res
                .status(409)
                .json(standardResponse(409,"Email already in use. Please use a different email address or proceed with the password reset.",null));
            }
            else{
                existingUser.password = password;
                existingUser.Name = name;
                existingUser.regno = regno;
                existingUser.department = department;
                await existingUser.save();
                return res
                .status(200)
                .json(standardResponse(200,`Signup Changes Made, Confirmation Mail Sent to: ${existingUser.email}`,null));
            }
        }
        const newUser = StudentModel(
            {
                "email": email,
                "HashEmail": await authEmailHasher(email),
                "password": password,
                "Name": name,
                "regno": regno,
                "department": department
            }
        )
        newUser.accessToken = await generateAccessToken();
        newUser.authCode = generateAuthToken({"id": newUser._id}, constants.authSecret);
        await newUser.save();
        return res
        .status(200)
        .json(standardResponse(200,`Confirmation Mail Sent to: ${newUser.email}`,null));

    }
    catch (error){
        console.log("Error: ", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error creating your account.",null));
    }
};

export const verifyStudent = async (req, res) => {
    try {
        const {auth} = req.query;
        const newUser = await StudentModel.findOne({"authCode": auth});
        if (!newUser){
            return res
            .status(400)
            .json(standardResponse(400,"Invalid Authentication."));
        }
        if (newUser.isVerified){
            return res
            .status(200)
            .json(standardResponse(200,"User already verified."));
        }
        const isverified = VerifyAuthToken(auth, constants.authSecret);
        if (!isverified){
            return res
            .status(400)
            .json(standardResponse(400, "Invalid Authentication Couldn't authenticate."));
        }
        await StudentModel.findOneAndUpdate({"authCode": auth},{"$set":{"isVerified":true}});
        return res.status(200).json(standardResponse(200,"Account verified successfully"));
    }
    catch (error){
        res.status(500).json(standardResponse(500,"Internal server issue"));
    }
};

export const resendAuthCodeStudent = async (req, res) => {
    try {
        const {email} = req.body;
        const existingUser = await StudentModel.findOne({'email': email});
        if (!existingUser.isVerified){
            existingUser.authCode = generateAuthToken({"id": existingUser._id}, constants.authSecret);
            await existingUser.save();
            return res
            .status(200)
            .json(standardResponse(200,"Authentication code successfully resent. Please check your email for the new code."));
        }
        return res
        .status(500)
        .json(standardResponse(500, "Failed to send authentication code. Please try again later."));
    }
    catch (error){
        return res
        .status(500)
        .json(standardResponse(500, "Failed to send authentication code. Please try again later."));
    }
};

export const loginStudent = async (req, res, next) => {
    try {
        const cookies = req.headers.cookie ? req.headers.cookie.split('; ').reduce((res, item) => {
            const data = item.split('=');
            res[data[0]] = data[1];
            return res;
        }, {}) : {};
        if (!('Authentication' in cookies)){ 
            const {email, password} = req.body;
            const existingUser = await StudentModel.findOne({'email': email});
            if (!existingUser){
                return res
                .status(404)
                .json(standardResponse(404, "Email not found. Please check your email address or sign up for a new account."));
            }
            if (!existingUser.isVerified){
                return res
                .status(400)
                .json(standardResponse(403, "User not verified. Please sign up or verify your account to proceed."))
            }
            compare(password, existingUser.password, function (err, result) {
                if (err || !result){
                    return res
                    .status(401)
                    .json(standardResponse(401,"Password mismatch. Please double-check your password and try again."));
                }
                const LoginToken = generateLoginToken(existingUser.accessToken, constants.loginSecret);
                const AuthEmail = authEmailHasher(email);
                res.cookie("Authentication",{LoginToken: LoginToken},{expires: new Date(Date.now() + 86400000), httpOnly:true, secure:true});
                res.cookie("Authemail", AuthEmail, {expires: new Date(Date.now() + 86400000), httpOnly:true, secure:true});
                const userObject = {"Name": existingUser.Name, "email": existingUser.email, "Department": existingUser.department};
                return res
                .status(200)
                .json(standardResponse(200, "Logged In successfully", userObject));
            });
        }
        else {
            const {Authentication} = req.cookies;
            const LoginToken = Authentication.LoginToken;
            const isLoginValid = VerifyAuthToken(LoginToken, constants.loginSecret);
            if (!isLoginValid){
                return res
                .status(403)
                .json(standardResponse(403, "Unauthorized request. You do not have permission to access this resource.",{authorized: false}));
            }
            next();

        }
    }
    catch (error) {
        console.log(error);
        return res
        .status(422)
        .json(standardResponse(422, "Unable to process request. Please check the request data and try again."));
    }
};

export const getStudent = async (req, res) => {
    try{
        const {Authemail} = req.cookies;

        const user = await StudentModel.findOne({"HashEmail": Authemail}, {"_id": 0, "password": 0, "accessToken": 0, "authCode": 0, "isVerified": 0, "OTP": 0, "createdAt": 0, "updatedAt": 0, "__v": 0});

        if (!user){
            return res
            .status(404)
            .json(standardResponse(404, "User Not Found", null));
        }
        return res
        .status(200)
        .json(standardResponse(200, "User Found", user));
    }
    catch(error){
        console.log("Error in getting user", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Getting User", null));
    }
}

export const getOTPStudent = async (req, res ) =>{
    try{
        const {email} = req.body;
        const existingUser = await StudentModel.findOne({'email': email});
        if (!existingUser){
            return res
            .status(404)
            .json(standardResponse(404, "Email not found. Please check your email address or sign up for a new account."));
        };
        existingUser.OTP = generateOTP();
        await existingUser.save();
        sendOTP(existingUser.email, existingUser.OTP);
        return res
        .status(200)
        .json(standardResponse(200,"OTP sent Successfully."));
        
    }
    catch (error){
        console.log(error);
        return res
        .status(422)
        .json(standardResponse(422, "Unable to process request. Please check the request data and try again."));
    }
};

export const TrueResponse = async (req, res) => {
    return res
    .status(200)
    .json(standardResponse(200, "Request is Valid"));
}

export const isOTPValidStudent = async (req, res, next) => {
    try{
        const {OTP, email} = req.body;
        const existingUser = await StudentModel.findOne({'email': email}); 
        if (!existingUser){
            return res
            .status(404)
            .json(standardResponse(404, "Email not found. Please check your email address or sign up for a new account."));
        };
        if (existingUser.OTP === OTP){
            next();
        }
        else{
            return res
            .status(403)
            .json(standardResponse(403,"OTP is inValid"));
        }

    }

    catch(error){
        console.log(error);
        return res
        .status(422)
        .json(standardResponse(422, "Unable to process request. Please check the request data and try again."));
    }
};

export const resetPasswordStudent = async (req, res) => {
    try{
        const {email, newPassword} = req.body;
        const existingUser = await StudentModel.findOne({'email': email}); 
        if (!existingUser){
            return res
            .status(404)
            .json(standardResponse(404, "Email not found. Please check your email address or sign up for a new account."));
        };
        existingUser.password = newPassword;
        await existingUser.save();
        return res
        .status(200)
        .json(standardResponse(200,"Password reset Successfull."));
    }
    catch(error){
        console.log(error);
        return res
        .status(422)
        .json(standardResponse(422, "Unable to process request. Please check the request data and try again."));
    }
};

export const joinCourse = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const {courseId} = req.body;
        const course = await CourseModel.findOne({"CourseId": courseId});
        const student = await StudentModel.findOne({"HashEmail": Authemail});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student Invalid. Please check the student id and try again."));
        }
        if (!course){
            return res
            .status(404)
            .json(standardResponse(404, "Course not found. Please check the course id and try again."));
        }
        if (course.Students.includes(student._id)){
            student.Courses.push({id: course._id, courseId: courseId, points: 0, level: 0});
            await student.save();
            return res
            .status(200)
            .json(standardResponse(200, "Student added to course successfully."));
        }
    }
    catch(error){
        console.log(error);
        return res
        .status(422)
        .json(standardResponse(422, "Unable to process request. Please check the request data and try again."));
    
    }
}

export const getMyCourses = async (req, res) => {
    try{
        const {Authemail} = req.cookies;
        const student = await StudentModel.findOne({"HashEmail": Authemail});
        if (!student){
            return res
            .status(404)
            .json(standardResponse(404, "Student Invalid. Please check the student id and try again."));
        }

        const courses = student.Courses;
        const courseInfo = await CourseModel.find({"_id": {$in: courses.map((course) => course.toJSON().id.toString())}}, {"_id": 0, "createdAt": 0, "updatedAt": 0, "__v": 0, "Students": 0});
        const data = {"Courses": courses, "CourseInfo": courseInfo};
        return res
        .status(200)
        .json(standardResponse(200, "Courses Found", data));
    }
    catch(error){
        console.log("Error in getting courses", error);
        return res
        .status(500)
        .json(standardResponse(500, "Error Getting Courses", null));
    }
};


export const Authvalid = async (req, res) => {
    try{
        return res
        .status(200)
        .json(standardResponse(200, "Authentication is Valid."));
    }
    catch(error){
        return res
        .status(500)
        .json(standardResponse(500, error))
    }
};

export const generate = (req, res) => {
    try {
        res.status(200).json(standardResponse(200, "Successfully loggedin and accessed."));
    }
    catch (error) {
        res.status(400).json(standardResponse(400, "Couldn't make through it."))
    }
};