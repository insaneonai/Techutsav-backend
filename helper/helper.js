import { randomUUID } from "crypto";
import { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { createTransport } from "nodemailer";
import { createHash } from "crypto";

export const emailRegexp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const authEmailHasher = function (email) {
  try {
    const hashedEmail = createHash("sha256").update(email).digest("hex");
    return hashedEmail;
  } catch (error) {
    throw "Error Hashing Email.";
  }
};

export const generateAccessToken = function () {
  try {
    const token = randomUUID();
    const hashedToken = hash(token, parseInt(process.env.SALT_ROUNDS));
    return hashedToken;
  } catch (error) {
    throw "Error Hashing accesstoken.";
  }
};

export const sendOTP = function (email, OTP) {
  try {
    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: "insaneonai@gmail.com",
        pass: "roos zoeo gpcw rjrj",
      },
    });

    const html_message = `<html>
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
		`;
    const message = {
      from: "insaneonai@gmail.com",
      to: email,
      html: html_message,
    };

    transporter.sendMail(message, (error, data) => {
      if (error) {
        console.log(`Couldn't send Email to ${email}.`, error);
      }
      transporter.close();
    });
  } catch (error) {
    return 500;
  }
};

export const sendVerificationLink = function (email, authCode) {
  try {
    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: "insaneonai@gmail.com",
        pass: "roos zoeo gpcw rjrj",
      },
    });

    const html_message = `<html>
		<body>
		<p> Greetings from Techutsav'26 <p>
		<p> Here is your verification link: 
		http://${process.env.HOST.concat(":", process.env.SERVER_PORT, "/api/verify/?", "auth=", authCode)}

		<p>
		Greetings<br>
		Techutsav'26 Team
		</p>
		</body>
		</html>
		`;
    const message = {
      from: "insaneonai@gmail.com",
      to: email,
      html: html_message,
    };

    transporter.sendMail(message, (error, data) => {
      if (error) {
        console.log(`Couldn't send Email to ${email}.`);
      }
      transporter.close();
    });
  } catch (error) {
    return 500;
  }
};

export const generateAuthToken = (data, secret) => {
  try {
    const Authtoken = jwt.sign(data, secret);
    return Authtoken;
  } catch (error) {
    throw "Error signing jwt.";
  }
};

export const predictLearnerLevel = (payload) => {
  try {
    /*
		const res = await fetch("https://tlb-tce-model-server.onrender.com/predict/", {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
				"Response-Type": "application/json"
			},
		});
		return res.json();*/
    const { correctRatio, incorrectType, timetaken, questionCount } = payload;

    if (correctRatio > 0.8) {
      if (timetaken < 40 * questionCount) {
        return "quick learner";
      } else {
        return "average learner";
      }
    } else if (correctRatio >= 0.5) {
      if (incorrectType == "conceptual") {
        return "average learner";
      } else if (incorrectType == "application") {
        if (timetaken < 60 * questionCount) {
          return "average learner";
        } else {
          return "slow learner";
        }
      } else {
        return "slow learner";
      }
    } else {
      if (incorrectType == 2) {
        if (timetaken > 60 * questionCount) {
          return "slow learner";
        } else {
          return "average learner";
        }
      } else {
        return "slow learner";
      }
    }
  } catch (error) {
    return null;
  }
};

export const VerifyAuthToken = (token, secret) => {
  try {
    const isValid = jwt.verify(token, secret);
    return isValid;
  } catch (error) {
    console.log("Error verifying auth token.", error);
    throw "Error Validating Auth Token.";
  }
};

export function standardResponse(statusCode, msg, data) {
  return {
    status: statusCode,
    msg: msg,
    data: data,
  };
}

export const generateLoginToken = (data, secret) => {
  try {
    const LoginToken = jwt.sign(data, secret, {
      expiresIn: "24h",
    });
    return LoginToken;
  } catch (error) {
    throw "Error Creating Login Token.";
  }
};

export const generateOTP = () => {
  try {
    let digits = "0123456789";
    let OTP = "";
    let len = digits.length;
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * len)];
    }

    return OTP;
  } catch (error) {
    throw "Error generating OTP.";
  }
};
