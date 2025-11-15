import express from "express";
import User from "../model/User.js";
import Movie from "../model/Movie.js";

const router = express.Router();

// Register or upsert a user (for OAuth flow)
// POST /api/users/upsert
router.post("/upsert", async (req, res) => {
  const { email, name, picture } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    const isNewUser = !existingUser;
    
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $set: { name, picture }, 
        $setOnInsert: { createdAt: new Date() } 
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      user, 
      isNewUser,
      message: isNewUser ? "Welcome! Your account has been created." : "Welcome back!"
    });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("favorites watchLater");
    res.json(user);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Add favorite: POST /api/users/:id/favorites/:movieId
router.post("/:id/favorites/:movieId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { $addToSet: { favorites: req.params.movieId } }, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove favorite
router.delete("/:id/favorites/:movieId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { $pull: { favorites: req.params.movieId } }, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Watch later endpoints (add/remove similar)
router.post("/:id/watch-later/:movieId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { $addToSet: { watchLater: req.params.movieId } }, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id/watch-later/:movieId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { $pull: { watchLater: req.params.movieId } }, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;