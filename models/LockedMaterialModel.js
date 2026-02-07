import mongoose from "mongoose";

const {Schema, model} = mongoose;


const LockedMaterialSchema = new Schema({
    Name: {type: String, required: "Name is required."},
    URL: {type: String, required: "Url is required."},
    accessTo: [{type: Schema.Types.ObjectId, ref: "Student", required: "Student ID is required"}]
}, {timestamps: true});

export const LockedMaterialModel = model("LockedMaterial", LockedMaterialSchema);