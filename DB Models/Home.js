import { Schema, model } from "mongoose";
const Home = new Schema(
    {
        video_link: {
            type: String,
            required: false
        },
        title: {
            type: String,
            required: true
        },
        description1: {
            type: String,
            required: false,
        },
        description2: {
            type: String,
            required: false,
        },
        description3: {
            type: String,
            required: false,
        },
        images_bar : {
            type :  [String],
            required: false,
        },
    }, { timestamps: true });
export default model('Home ', Home);