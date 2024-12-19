import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Логин обязателен!"],
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
});

export const User = mongoose.model("User", userSchema);
