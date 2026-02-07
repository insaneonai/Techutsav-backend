"use strict";

import { PaymentModel } from "../models/PaymentModel.js";
import { standardResponse } from "../helper/helper.js";


 //Upload Payment Info

export const uploadPaymentInfo = async (req, res) => {
  try {
    const { TXNID, amount, passType } = req.body;
    const userId = req.user.userId;

    if (!req.file || !TXNID || !amount || !passType) {
      return res
        .status(400)
        .json(
          standardResponse(
            400,
            "Screenshot, TXNID, amount and passType are required"
          )
        );
    }

    // Max 3 payments per user
    const paymentCount = await PaymentModel.countDocuments({ userId });
    if (paymentCount >= 3) {
      return res
        .status(403)
        .json(
          standardResponse(
            403,
            "Maximum payment limit reached (3 payments allowed)"
          )
        );
    }

    // Duplicate TXN check
    const existingTxn = await PaymentModel.findOne({ TXNID });
    if (existingTxn) {
      return res
        .status(409)
        .json(standardResponse(409, "Transaction ID already exists"));
    }

    // Convert image → base64
    const base64Image = req.file.buffer.toString("base64");
    const payment = await PaymentModel.create({
      userId,
      TXNID,
      amount,
      passType,
      screenshotUrl: base64Image,
      screenshotMimeType: req.file.mimetype,
    });

    return res.status(201).json(
      standardResponse(
        201,
        "Payment uploaded successfully. Awaiting verification.",
        payment
      )
    );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(standardResponse(500, "Failed to upload payment"));
  }
};


 // View all payments (Admin)
 
export const viewAllPayments = async (req, res) => {
  try {
    if(req.user.role!=="PaymentAdmin"){
        return res
          .status(403)        
          .json(standardResponse(403, "Access denied"));    
    }
    const payments = await PaymentModel.find()
      .populate("userId", "name email phoneNo collegeId")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(standardResponse(200, "Payments fetched", payments));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(standardResponse(500, "Failed to fetch payments"));
  }
};


  //Update payment status (Admin)

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if(req.user.role!=="PaymentAdmin"){
        return res
          .status(403)        
          .json(standardResponse(403, "Access denied"));    
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json(standardResponse(400, "Invalid payment status"));
    }

    const payment = await PaymentModel.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );

    if (!payment) {
      return res
        .status(404)
        .json(standardResponse(404, "Payment not found"));
    }

    return res
      .status(200)
      .json(
        standardResponse(200, "Payment status updated successfully", payment)
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(standardResponse(500, "Failed to update payment status"));
  }
};
