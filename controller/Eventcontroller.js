"use strict";

import { standardResponse } from "../helper/helper.js";
import { EventModel } from "../models/EventModel.js";

export const createEvent = async (req, res) => {
  try {
    const {
      name,
      department,
      description,
      ruleBookUrl,
      prizesInfo,
      ruleDescription,
      orgContact,
      category,
      posterUrl,
      date,
      time,
      isTeamEvent,
      maxTeamSize,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !department ||
      !description ||
      !ruleBookUrl ||
      !prizesInfo ||
      !ruleDescription ||
      !orgContact ||
      !category ||
      !posterUrl
    ) {
      return res.status(400).json(
        standardResponse(400, "All required fields must be provided")
      );
    }

    // Validate category enum
    if (!["Tech", "NonTech"].includes(category)) {
      return res.status(400).json(
        standardResponse(
          400,
          "Invalid category. Must be either 'Online' or 'Offline'"
        )
      );
    }

    // Validate organizerId from authenticated user
    if (!req.user.userId && req.user.role !== "EventOrganizer" ) {
      return res.status(401).json(
        standardResponse(
          401,
          "Unauthorized: Only authenticated Event Organizers can create events"
        )
    );
    }

    // Create new event
    const newEvent = new EventModel({
      name,
      department,
      description,
      ruleBookUrl,
      prizesInfo,
      ruleDescription,
      orgContact,
      category,
      date,
      time,
      posterUrl,
      isTeamEvent: isTeamEvent || false,
      maxTeamSize: maxTeamSize || 1,
      organizerId: req.user.userId,
    });

    await newEvent.save();

    return res.status(201).json(
        standardResponse(
            201,
            "Event created successfully",
            { event: newEvent }
        )
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json(
        standardResponse(
            500,
            "Error creating event",
            { error: error.message }
        )
    );
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.find({});

    if (!events || events.length === 0) {
      return res.status(200).json(standardResponse(
          200,
          "No events found",
          { events: [] }
      ));
    }

    return res.status(200).json(standardResponse(
        200,
        "Events retrieved successfully",
        { events }
    ));
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json(
        standardResponse(
            500,
            "Error fetching events",
            { error: error.message }
        )
    );
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json(
        standardResponse(400, "Event ID is required")
      );
    }

    // Find the event
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json(
        standardResponse(404, "Event not found")
      );
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== req.user.userId) {
      return res.status(403).json(
        standardResponse(
          403,
          "Unauthorized: Only the event organizer can update this event"
        )
      );
    }

    // Validate category if being updated
    if (updates.category && !["Online", "Offline"].includes(updates.category)) {
      return res.status(400).json(
        standardResponse(
          400,
          "Invalid category. Must be either 'Online' or 'Offline'"
        )
      );
    }

    // Update the event
    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json(
      standardResponse(
        200,
        "Event updated successfully",
        { event: updatedEvent }
      )
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json(
      standardResponse(
        500,
        "Error updating event",
        { error: error.message }
      )
    );
  }
};

export const getMyEvents = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user.userId && req.user.role !== "EventOrganizer") {
      return res.status(401).json(
        standardResponse(401, "Unauthorized: Please login to view your events")
      );
    }

    // Find events created by the current user
    const myEvents = await EventModel.find({ organizerId: req.user.userId })
      .sort({ createdAt: -1 });

    if (!myEvents || myEvents.length === 0) {
      return res.status(200).json(
        standardResponse(
          200,
          "No events found",
          { events: [] }
        )
      );
    }

    return res.status(200).json(
      standardResponse(
        200,
        "Your events retrieved successfully",
        { 
          events: myEvents,
          totalEvents: myEvents.length
        }
      )
    );
  } catch (error) {
    console.error("Error fetching user events:", error);
    return res.status(500).json(
      standardResponse(
        500,
        "Error fetching your events",
        { error: error.message }
      )
    );
  }
};
