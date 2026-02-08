"use strict";

import { standardResponse } from "../helper/helper.js";
import { EventModel } from "../models/EventModel.js";
import { UserEventRegisterModel } from "../models/UserEventRegisterModel.js";
import { PaymentModel } from "../models/PaymentModel.js";

export const registerEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    // Validate eventId
    if (!eventId) {
      return res.status(400).json(
        standardResponse(400, "Event ID is required")
      );
    }

    // Check if user is authenticated
    if (!req.user.userId) {
      return res.status(401).json(
        standardResponse(401, "Unauthorized: Please login to register for an event")
      );
    }

    // check payment status if event is paid (this part can be implemented later when payment integration is done)
    
    const paymentInfo = await PaymentModel.findOne({ userId: req.user.userId , passType: "EVENT"});
    if (paymentInfo && paymentInfo.status !== "APPROVED") {
      return res.status(402).json(
        standardResponse(402, "Payment required: Please complete the payment to register for this event")
      );
    }

      
    // Find the event
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json(
        standardResponse(404, "Event not found")
      );
    }

    // Check if user is already registered
    const existingRegistration = await UserEventRegisterModel.findOne({
      eventId: eventId,
      userId: req.user.userId,
    });

    if (existingRegistration) {
      return res.status(400).json(
        standardResponse(400, "You are already registered for this event")
      );
    }

    // Create registration
    const registration = new UserEventRegisterModel({
      eventId: eventId,
      userId: req.user.userId,
      teamId : null,
      status: "Registered",
    });

    await registration.save();

    return res.status(200).json(
      standardResponse(200, "Registered for event successfully", { registration })
    );

  } catch (error) {
    console.error("Error registering for event:", error);
    return res.status(500).json(
      standardResponse(
        500,
        "Error registering for event",
        { error: error.message }
      )
    );
  }
};

export const getRegisteredEvents = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user.userId) {
      return res.status(401).json(
        standardResponse(401, "Unauthorized: Please login to view your registered events")
      );
    }

    // Find all registrations for the current user
    const registrations = await UserEventRegisterModel.find({ userId: req.user.userId })
      .populate("eventId", "name department category description posterUrl date time venue")
      .sort({ createdAt: -1 });

    if (!registrations || registrations.length === 0) {
      return res.status(200).json(
        standardResponse(
          200,
          "No registered events found",
          { events: [] }
        )
      );
    }

    // Extract events from registrations
    const events = registrations.map(reg => ({
      registrationId: reg._id,
      ...reg.eventId.toObject(),
      registrationStatus: reg.status,
      registrationDate: reg.createdAt,
    }));

    return res.status(200).json(
      standardResponse(
        200,
        "Registered events retrieved successfully",
        {
          events: events,
          totalRegisteredEvents: events.length,
        }
      )
    );
  } catch (error) {
    console.error("Error fetching registered events:", error);
    return res.status(500).json(
      standardResponse(
        500,
        "Error fetching registered events",
        { error: error.message }
      )
    );
  }
};
