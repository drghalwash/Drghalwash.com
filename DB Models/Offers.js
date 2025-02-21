import { Schema, model } from "mongoose";
const Offers = new Schema(
    {
        video_link: {
            type: String,
            required: false
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false,
        },
    }, { timestamps: true });
export default model('Offers ', Offers);