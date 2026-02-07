import { UserModel } from "../models/Usermodel.js";
import { CollegeModel } from "../models/CollegeModel.js";
import { compare } from "bcrypt";
import {
  standardResponse,
  generateAuthToken,
  VerifyAuthToken,
  generateLoginToken,
  emailRegexp,
  authEmailHasher,
} from "../helper/helper.js";
import { createTransport } from "nodemailer";

export const signupUser = async (req, res) => {
  try {
    const { email, password, name, collegeId, phoneNo, year, department } =
      req.body;

    // validate req.body
    if (
      !email ||
      !password ||
      !name ||
      !collegeId ||
      !phoneNo ||
      !year ||
      !department
    ) {
      return res
        .status(400)
        .json(
          standardResponse(
            400,
            "Missing required fields. Please ensure all fields are filled.",
          ),
        );
    }

    if (!emailRegexp.test(email)) {
      return res
        .status(400)
        .json(
          standardResponse(
            400,
            "Invalid Email ID. Please provide a valid email address.",
          ),
        );
    }

    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
      return res
        .status(409)
        .json(
          standardResponse(
            409,
            "Email already in use. Please use a different email address or proceed with the password reset.",
            null,
          ),
        );
    }

    const newUser = UserModel({
      email: email,
      password: password,
      name: name,
      collegeId: collegeId,
      phoneNo: phoneNo,
      year: year,
      department: department,
      role: "participant",
    });

    newUser.emailAuthCode = generateAuthToken(
      { id: newUser._id },
      process.env.authSecret,
    );

    await newUser.save();

    return res
      .status(200)
      .json(
        standardResponse(
          200,
          `Signup Successful, Confirmation Mail Sent to: ${newUser.email}`,
          null,
        ),
      );
  } catch (error) {
    console.log("Error: ", error);
    return res
      .status(500)
      .json(standardResponse(500, "Error creating your account.", null));
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { auth } = req.query;
    const newUser = await UserModel.findOne({ emailAuthCode: auth });
    if (!newUser) {
      return res
        .status(400)
        .json(standardResponse(400, "Invalid Authentication."));
    }
    if (newUser.isEmailVerified) {
      return res
        .status(200)
        .json(standardResponse(200, "User already verified."));
    }
    await UserModel.findOneAndUpdate(
      { emailAuthCode: auth },
      { $set: { isEmailVerified: true } },
    );

    // Increment college total count
    await CollegeModel.findOneAndUpdate(
      { _id: newUser.collegeId },
      { $inc: { totalCount: 1 } },
    );

    return res
      .status(200)
      .json(standardResponse(200, "Account verified successfully"));
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json(standardResponse(500, "Internal server issue"));
  }
};

export const resendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await UserModel.findOne({ email: email });
    if (!existingUser) {
      return res
        .status(404)
        .json(
          standardResponse(
            404,
            "Email not found. Please check your email address or sign up for a new account.",
          ),
        );
    }
    if (!existingUser.isEmailVerified) {
      existingUser.emailAuthCode = generateAuthToken(
        { id: existingUser._id },
        process.env.authSecret,
      );
      await existingUser.save();
      return res
        .status(200)
        .json(
          standardResponse(
            200,
            "Authentication code successfully resent. Please check your email for the new code.",
          ),
        );
    }
    return res
      .status(403)
      .json(standardResponse(403, "The user is already Verified"));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        standardResponse(
          500,
          "Failed to send authentication code. Please try again later.",
        ),
      );
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const cookies = req.headers.cookie
      ? req.headers.cookie.split("; ").reduce((res, item) => {
          const data = item.split("=");
          res[data[0]] = data[1];
          return res;
        }, {})
      : {};
    if (!("Authentication" in cookies)) {
      const { email, password } = req.body;
      const existingUser = await UserModel.findOne({ email: email });
      if (!existingUser) {
        return res
          .status(404)
          .json(
            standardResponse(
              404,
              "Email not found. Please check your email address or sign up for a new account.",
            ),
          );
      }
      if (!existingUser.isEmailVerified) {
        return res
          .status(400)
          .json(
            standardResponse(
              403,
              "User not verified. Please sign up or verify your account to proceed.",
            ),
          );
      }
      compare(password, existingUser.password, function (err, result) {
        if (err || !result) {
          return res
            .status(401)
            .json(
              standardResponse(
                401,
                "Password mismatch. Please double-check your password and try again.",
              ),
            );
        }
        const userPayload = {
          userId: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          collegeId: existingUser.collegeId,
        };
        const LoginToken = generateLoginToken(
          userPayload,
          process.env.loginSecret,
        );
        res.cookie(
          "Authentication",
          { LoginToken: LoginToken },
          {
            expires: new Date(Date.now() + 86400000),
            httpOnly: true,
            path: "/",
          },
        );

        const {
          password,
          emailAuthCode,
          isVerified,
          createdAt,
          updatedAt,
          __v,
          ...userObject
        } = existingUser.toJSON();
        return res
          .status(200)
          .json(standardResponse(200, "Logged In successfully", userObject));
      });
    } else {
      // To function as a middleware

      const { Authentication } = req.cookies;
      const LoginToken = Authentication.LoginToken;
      const decodedToken = VerifyAuthToken(LoginToken, process.env.loginSecret);
      if (!decodedToken) {
        return res
          .status(403)
          .json(
            standardResponse(
              403,
              "Unauthorized request. You do not have permission to access this resource.",
              { authorized: false },
            ),
          );
      }

      console.log("Decoded Token: ", decodedToken); // Debugging line

      // Use decoded token payload directly
      req.user = decodedToken;

      next();
    }
  } catch (error) {
    console.log(error);
    return res
      .status(422)
      .json(
        standardResponse(
          422,
          "Unable to process request. Please check the request data and try again.",
        ),
      );
  }
};

export const loginUserDefaultNext = async (req, res) => {
  try {
    // This function simply returns logged in user details, it is used as a default next function for loginUser middleware
    const userObject = req.user;

    return res
      .status(200)
      .json(standardResponse(200, "Logged In successfully", userObject));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        standardResponse(
          500,
          "An unexpected error occurred while processing your request. Please try again later.",
        ),
      );
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json(standardResponse(400, "Email is required", null));
    }

    if (!emailRegexp.test(email)) {
      return res
        .status(400)
        .json(standardResponse(400, "Invalid email format", null));
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res
        .status(200)
        .json(
          standardResponse(
            200,
            "If the email exists, a password reset link has been sent",
            null,
          ),
        );
    }

    // Generate reset token
    const resetToken = authEmailHasher(email + Date.now().toString());
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send email with reset link
    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: "insaneonai@gmail.com",
        pass: "roos zoeo gpcw rjrj",
      },
    });

    const resetLink = `http://${process.env.HOST}:${process.env.SERVER_PORT}/api/reset-password?token=${resetToken}`;
    const htmlMessage = `<html>
      <body>
        <p>Greetings from Techutsav'26</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Greetings<br>Techutsav'26 Team</p>
      </body>
    </html>`;

    const message = {
      from: "insaneonai@gmail.com",
      to: email,
      subject: "Password Reset Request - Techutsav'26",
      html: htmlMessage,
    };

    transporter.sendMail(message, (error) => {
      if (error) {
        console.log(`Couldn't send email to ${email}.`, error);
      }
      transporter.close();
    });

    return res
      .status(200)
      .json(
        standardResponse(
          200,
          "If the email exists, a password reset link has been sent",
          null,
        ),
      );
  } catch (error) {
    console.log("Error in forgotPassword:", error);
    return res
      .status(500)
      .json(
        standardResponse(
          500,
          "An error occurred while processing your request",
          null,
        ),
      );
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json(
          standardResponse(400, "Token and new password are required", null),
        );
    }

    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json(standardResponse(400, "Invalid or expired reset token", null));
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json(
        standardResponse(
          200,
          "Password reset successfully. You can now login with your new password.",
          null,
        ),
      );
  } catch (error) {
    console.log("Error in resetPassword:", error);
    return res
      .status(500)
      .json(
        standardResponse(
          500,
          "An error occurred while resetting your password",
          null,
        ),
      );
  }
};
