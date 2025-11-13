import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 0, max: 10 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Review", reviewSchema);