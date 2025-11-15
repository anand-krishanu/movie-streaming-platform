import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./routes/movieRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { seedMovies } from "./seedMovies.js";

dotenv.config();

const app = express();

// CORS configuration for frontend with credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => res.json({ ok: true, time: new Date() }));

const PORT = process.env.PORT || 5000;
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Auto-seed movies if collection is empty
    try {
      await seedMovies();
    } catch (error) {
      console.warn("Auto-seeding failed:", error.message);
    }
    
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
