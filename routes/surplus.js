const express = require('express');
const router = express.Router();
const Surplus = require('../models/Surplus');
const { protect, authorize } = require('../middleware/auth');

// Submit surplus suggestion
router.post('/', protect, async (req, res) => {
  try {
    const surplus = new Surplus({
      ...req.body,
      user: req.user._id
    });
    const newSurplus = await surplus.save();
    res.status(201).json(newSurplus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all surplus suggestions (admin) or user's surplus suggestions
router.get('/', protect, async (req, res) => {
  try {
    // If user is admin, return all surplus
    if (req.user.role === 'admin') {
      const surplus = await Surplus.find();
      return res.json(surplus);
    }
    
    // If regular user, return only their surplus
    const surplus = await Surplus.find({ user: req.user._id });
    res.json(surplus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;