import { randomUUID } from "crypto";
import { hash } from 'bcrypt';
import * as constants from "../constants.js";
import jwt from "jsonwebtoken";
import { createTransport } from 'nodemailer';
import { createHash } from 'crypto';

export const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;


export const authEmailHasher = function (email) {
	try{
		const hashedEmail = createHash('sha256').update(email).digest('hex');
		return hashedEmail;
	}
	catch (error){
		throw "Error Hashing Email.";
	}

}

export const generateAccessToken = function () {
	try{
        const token = randomUUID();
		const hashedToken = hash(token, constants.saltRounds);
		return hashedToken;
	}
	catch (error){
		throw "Error Hashing accesstoken.";
	}
};

export const sendOTP = function (email, OTP){
	try{
		const transporter = createTransport({
			service: 'gmail',
			auth: {
				user: 'insaneonai@gmail.com',
				pass: 'objb xcre khvv xlxm'
			}
		});

		const html_message = 
		`<html>
		<body>
		<p> Greetings from TCE-LMS <p>
		<p> Here is your OTP:
		${OTP} 
		<p>
		Greetings<br>
		TCE-LMS
		</p>
		</body>
		</html>
		`
		const message = {
			from: "insaneonai@gmail.com",
			to: email,
			html: html_message,
		}

		transporter.sendMail(message, (error, data) => {
			if (error){
				throw `Couldn't send Email to ${email}.`;
			}
			transporter.close()
		})
	}

	catch (error){
		throw `Couldn't send OTP`;
	}
}

export const sendVerificationLink = function (email, authCode) {
	try {
		const transporter = createTransport({
			service: 'gmail',
			auth: {
				user: 'insaneonai@gmail.com',
				pass: 'objb xcre khvv xlxm'
			}
		});

		const html_message = 
		`<html>
		<body>
		<p> Greetings from TCE-LMS <p>
		<p> Here is your verification link: 
		${constants.HOST.concat("/api/verify?","auth=",authCode)}

		<p>
		Greetings<br>
		TCE-LMS
		</p>
		</body>
		</html>
		`
		const message = {
			from: "insaneonai@gmail.com",
			to: email,
			html: html_message,
		}

		transporter.sendMail(message, (error, data) => {
			if (error){
				throw `Couldn't send Email to ${email}.`;
			}
			transporter.close()
		})
	}
	catch (error) {
		throw `Couldn't send Email`;
	}
};

export const generateAuthToken = (data, secret) => {
	try{
	  const Authtoken = jwt.sign(data, secret);
	  return Authtoken;
	}
	catch (error){
		throw "Error signing jwt.";
	}
};

export const VerifyAuthToken = (token, secret) => {
	try{
		const isValid = jwt.verify(token, secret);
		return isValid;
	}
	catch (error){
		throw "Error Validating Auth Token.";
	}
};

export function standardResponse(statusCode, msg, data) {
	return {
		status: statusCode,
		msg: msg,
		data: data,
	};
};

export const generateLoginToken = (data, secret) => {
	try {
		const LoginToken = jwt.sign({"accessToken": data}, secret,{"expiresIn": '24h'});
		return LoginToken;
	}
	catch (error){
		throw "Error Creating Login Token."
	}
}

export const generateOTP = () => { 
	try{
		let digits = '0123456789'; 
		let OTP = ''; 
		let len = digits.length 
		for (let i = 0; i < 6; i++) { 
			OTP += digits[Math.floor(Math.random() * len)]; 
		} 
		
		return OTP; 
	}
	catch(error){
		throw "Error generating OTP.";
	}
} 

