import { Schema, model } from "mongoose";
const Photo_Gallary_images = new Schema(
    {
        Photo_Gallary: {
            type : Schema.Types.ObjectId,
            required: true,
        },
        Status: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
        },
        title1: {
            type: String,
            required: true,
        },
        description1: {
            type: String,
            required: true,
        },
        title2: {
            type: String,
            required: false,
        },
        description2: {
            type: String,
            required: false,
        },
        title3: {
            type: String,
            required: false,
        },
        description3: {
            type: String,
            required: false,
        },
        icon : {
            type: String,
            required: false,
        },
        images : {
            type :  [String],
            required: false,
        },
    }, { timestamps: true });
export default model('Photo_Gallary_images ', Photo_Gallary_images);