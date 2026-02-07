import { UserModel } from "./Usermodel.js"
import * as database from "../database/db.js"
import { generateAccessToken, generateAuthToken } from "../helper/helper.js";

const newUser = new UserModel({
    email : "insaneonai@gmail.com",
    password : "hello world"
});
newUser.accessToken = await generateAccessToken();
newUser.authCode = generateAuthToken({"id": newUser._id, "time": Date()}, newUser.accessToken);
newUser.save()
