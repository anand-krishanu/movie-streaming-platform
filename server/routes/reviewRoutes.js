import express from "express";
import mongoose from "mongoose";
import Review from "../model/Review.js";

const router = express.Router();

// POST /api/reviews
router.post("/", async (req, res) => {
  try {
    const r = new Review(req.body);
    await r.save();
    res.status(201).json(r);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET /api/reviews/:movieId
router.get("/:movieId", async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reviews/stats/:movieId
router.get("/stats/:movieId", async (req, res) => {
  try {
    const pipeline = [
      { $match: { movieId: new mongoose.Types.ObjectId(req.params.movieId) } },
      { $group: { _id: "$movieId", avgRating: { $avg: "$rating" }, total: { $sum: 1 } } }
    ];
    const result = await Review.aggregate(pipeline);
    res.json(result[0] || { avgRating: 0, total: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;