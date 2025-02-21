import { Schema, model } from "mongoose";
const Contact = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
        },
        procedures: {
            type: String,
            required: true,
        },
        questions : {
            type: String,
            required: false,
        },
    }, { timestamps: true });
export default model('Contact ', Contact);