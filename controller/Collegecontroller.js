"use strict";

import { CollegeModel } from "../models/CollegeModel.js";
import { standardResponse } from "../helper/helper.js";

// Create a new college
export const createCollege = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json(standardResponse(400, "College name is required", null));
    }

    // Check if college already exists
    const existingCollege = await CollegeModel.findOne({ name });
    if (existingCollege) {
      return res
        .status(409)
        .json(standardResponse(409, "College already exists", null));
    }

    const newCollege = new CollegeModel({ name });
    await newCollege.save();

    return res
      .status(201)
      .json(standardResponse(201, "College created successfully", newCollege));
  } catch (error) {
    console.error("Error creating college:", error);
    return res
      .status(500)
      .json(standardResponse(500, "Internal server error", null));
  }
};

// Get all colleges
export const getAllColleges = async (req, res) => {
  try {
    const colleges = await CollegeModel.find().sort({ createdAt: -1 });

    return res
      .status(200)
      .json(standardResponse(200, "Colleges fetched successfully", colleges));
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return res
      .status(500)
      .json(standardResponse(500, "Internal server error", null));
  }
};

// Update a college
export const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isVerified, totalCount } = req.body;

    if (!id) {
      return res
        .status(400)
        .json(standardResponse(400, "College ID is required", null));
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (totalCount !== undefined) updateData.totalCount = totalCount;

    const updatedCollege = await CollegeModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedCollege) {
      return res
        .status(404)
        .json(standardResponse(404, "College not found", null));
    }

    return res
      .status(200)
      .json(
        standardResponse(200, "College updated successfully", updatedCollege),
      );
  } catch (error) {
    console.error("Error updating college:", error);
    return res
      .status(500)
      .json(standardResponse(500, "Internal server error", null));
  }
};

// Delete a college
export const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json(standardResponse(400, "College ID is required", null));
    }

    const deletedCollege = await CollegeModel.findByIdAndDelete(id);

    if (!deletedCollege) {
      return res
        .status(404)
        .json(standardResponse(404, "College not found", null));
    }

    return res
      .status(200)
      .json(
        standardResponse(200, "College deleted successfully", deletedCollege),
      );
  } catch (error) {
    console.error("Error deleting college:", error);
    return res
      .status(500)
      .json(standardResponse(500, "Internal server error", null));
  }
};
