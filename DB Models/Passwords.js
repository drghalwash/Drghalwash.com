import { Schema, model } from "mongoose";

const Passwords = new Schema(
  {
    password: {
      type: String,
      required: true,
    },
    Creation_time: {
      type: Date, // Use Date type to store time.
      required: true,
      default: Date.now, // Automatically set to the current time.
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`.
);

export default model("Passwords", Passwords);
