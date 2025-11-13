import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, index: true },
  picture: String,
  role: { type: String, enum: ["USER","ADMIN"], default: "USER" },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  watchLater: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);