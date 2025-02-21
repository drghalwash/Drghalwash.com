import { Schema, model } from "mongoose";
const Blog = new Schema(
    {
        Category: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
        },
        read_more_image: {
            type: String,
            required: false,
        },
        read_more_Titles: {
            type:  [String],
            required: false,
        },
        read_more_Texts : {
            type :  [String],
            required: false,
        },
    }, { timestamps: true });
export default model('Blog ', Blog);