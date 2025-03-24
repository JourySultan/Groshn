const express = require('express');
const router = express.Router();
const Surplus = require('../models/Surplus');
const auth = require('../middleware/auth');

// Submit surplus suggestion
router.post('/', auth, async (req, res) => {
  try {
    const surplus = new Surplus({
      ...req.body,
      user: req.user.userId
    });
    const newSurplus = await surplus.save();
    res.status(201).json(newSurplus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's surplus suggestions
router.get('/', auth, async (req, res) => {
  try {
    const surplus = await Surplus.find({ user: req.user.userId });
    res.json(surplus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;