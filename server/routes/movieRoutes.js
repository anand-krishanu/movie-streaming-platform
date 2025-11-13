import express from "express";
import mongoose from "mongoose";
import Movie from "../model/Movie.js";

const router = express.Router();

// GET /api/movies - list with optional pagination
router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(100, parseInt(req.query.limit || "24"));
  const skip = (page - 1) * limit;
  try {
    const total = await Movie.countDocuments();
    const movies = await Movie.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    res.json({ movies, page, limit, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET by id
router.get("/:id", async (req, res) => {
  try {
    const m = await Movie.findById(req.params.id);
    if (!m) return res.status(404).json({ error: "Not found" });
    res.json(m);
  } catch (e) { res.status(400).json({ error: "Invalid id" }); }
});

// POST create (admin in future)
router.post("/", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* Aggregations */

// GET /api/movies/by-genre
router.get("/aggregate/by-genre", async (req, res) => {
  const pipeline = [
    { $unwind: "$genre" },
    { $group: { _id: "$genre", movies: { $push: "$$ROOT" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  try {
    const out = await Movie.aggregate(pipeline);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/movies/aggregate/stats
router.get("/aggregate/stats", async (req, res) => {
  const pipeline = [
    { $unwind: "$genre" },
    { $group: { _id: "$genre", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    { $sort: { avgRating: -1 } }
  ];
  try {
    const out = await Movie.aggregate(pipeline);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/movies/aggregate/top-rated
router.get("/aggregate/top-rated", async (req, res) => {
  try {
    const out = await Movie.find().sort({ rating: -1 }).limit(10);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/movies/search?q=
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const movies = await Movie.find({ title: { $regex: q, $options: "i" } }).limit(50);
    res.json(movies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;