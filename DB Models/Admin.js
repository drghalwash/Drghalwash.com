import { Schema, model } from "mongoose";
const Admin = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
        },
        generated_Passwords : {
            type :  [String],
            required: false,
        },
    }, { timestamps: true });
export default model('Admin ', Admin);