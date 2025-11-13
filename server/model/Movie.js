import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: String,
  genre: [{ type: String, index: true }],
  year: Number,
  rating: { type: Number, default: 0, index: true },
  duration: Number,
  language: String,
  poster: String,
  filePath: String,
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default mongoose.model("Movie", movieSchema);