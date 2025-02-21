import { Schema, model } from "mongoose";
const Photo_Gallary = new Schema(
    {
        name: {
            type: String,
            required: false
        },
        image: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
    }, { timestamps: true });
export default model('Photo_Gallary ', Photo_Gallary);